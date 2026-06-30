#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Construction d'un vbaProject.bin minimal (format [MS-OVBA] + conteneur OLE/CFBF
[MS-CFB]) contenant un module standard. Utilisé pour produire la version .xlsm
du devis One Way avec une macro « Enregistrer le paiement ».

Aucune dépendance externe pour la construction ; `olefile` sert uniquement à la
validation (lecture du conteneur produit).
"""
import struct

CP = 1252  # codepage


# ─────────────────────────── Compression MS-OVBA (2.4.1) ───────────────────────
def ovba_compress(data: bytes) -> bytes:
    """Compression « littérale » (chunks non compressés au sens LZ : uniquement
    des tokens littéraux). Valide tant que chaque chunk décompressé ≤ 4096 octets."""
    out = bytearray(b"\x01")  # SignatureByte
    pos = 0
    # 3640 octets source max par chunk → ChunkData ≤ 4096 (overhead 1/8)
    while pos < len(data):
        block = data[pos:pos + 3640]
        pos += len(block)
        chunk = bytearray()
        i = 0
        while i < len(block):
            chunk.append(0x00)  # FlagByte : 8 tokens littéraux
            chunk += block[i:i + 8]
            i += 8
        size_field = (len(chunk) - 1) & 0x0FFF
        header = 0x8000 | 0x3000 | size_field  # flag=1, signature=0b011
        out += struct.pack("<H", header)
        out += chunk
    return bytes(out)


def ovba_decompress(data: bytes) -> bytes:
    """Décompresseur conforme (validation du round-trip)."""
    assert data[0] == 0x01
    out = bytearray()
    i = 1
    while i < len(data):
        header = struct.unpack_from("<H", data, i)[0]
        i += 2
        size = (header & 0x0FFF) + 3
        flag = (header >> 15) & 1
        end = i + size - 2
        if not flag:
            out += data[i:i + 4096]
            i = end
            continue
        while i < end:
            flagbyte = data[i]; i += 1
            for bit in range(8):
                if i >= end:
                    break
                if not (flagbyte >> bit) & 1:
                    out.append(data[i]); i += 1
                else:
                    tok = struct.unpack_from("<H", data, i)[0]; i += 2
                    # (copy tokens non générés par notre compresseur)
                    cur = len(out)
                    # bit width
                    bc = max((cur - 1).bit_length(), 4)
                    lmask = 0xFFFF >> bc
                    off = (tok >> (16 - bc)) + 1
                    ln = (tok & lmask) + 3
                    start = len(out) - off
                    for k in range(ln):
                        out.append(out[start + k])
    return bytes(out)


# ─────────────────────────── Flux « dir » ([MS-OVBA] 2.3.4.2) ──────────────────
def _rec(rid, data):
    return struct.pack("<HI", rid, len(data)) + data


def _mbcs(s):
    return s.encode("cp1252")


def _u16(s):
    return s.encode("utf-16-le")


def build_dir(project_name="VBAProject", module_name="Module1"):
    b = bytearray()
    # PROJECTINFORMATION
    b += _rec(0x0001, struct.pack("<I", 0x00000001))           # SYSKIND Win32
    b += _rec(0x0002, struct.pack("<I", 0x00000409))           # LCID
    b += _rec(0x0014, struct.pack("<I", 0x00000409))           # LCIDINVOKE
    b += _rec(0x0003, struct.pack("<H", CP))                   # CODEPAGE
    b += _rec(0x0004, _mbcs(project_name))                     # NAME
    b += _rec(0x0005, b"")                                     # DOCSTRING
    b += _rec(0x0040, b"")                                     #   Reserved unicode
    b += _rec(0x0006, b"")                                     # HELPFILE1
    b += _rec(0x003D, b"")                                     #   HELPFILE2
    b += _rec(0x0007, struct.pack("<I", 0))                    # HELPCONTEXT
    b += _rec(0x0008, struct.pack("<I", 0))                    # LIBFLAGS
    # VERSION (taille réservée 0x04, puis major(4)+minor(2))
    b += struct.pack("<HI", 0x0009, 4) + struct.pack("<IH", 0x00000004, 0x0009)
    b += _rec(0x000C, b"")                                     # CONSTANTS
    b += _rec(0x003C, b"")                                     #   Reserved unicode
    # PROJECTREFERENCES : stdole + VBA
    for name, libid in (
        ("stdole", r"*\G{00020430-0000-0000-C000-000000000046}#2.0#0#C:\Windows\System32\stdole2.tlb#OLE Automation"),
        ("VBA", r"*\G{000204EF-0000-0000-C000-000000000046}#4.2#9#C:\PROGRA~2\COMMON~1\MICROS~1\VBA\VBA7.1\VBE7.DLL#Visual Basic For Applications"),
    ):
        b += _rec(0x0016, _mbcs(name))                         # REFERENCENAME
        b += struct.pack("<HI", 0x003E, len(_u16(name))) + _u16(name)
        lib = _mbcs(libid)
        reg = struct.pack("<I", len(lib)) + lib + struct.pack("<IH", 0, 0)
        b += struct.pack("<HI", 0x000D, len(reg)) + reg       # REFERENCEREGISTERED
    # PROJECTMODULES
    b += _rec(0x000F, struct.pack("<H", 1))                    # MODULES count
    b += _rec(0x0013, struct.pack("<H", 0xFFFF))              # COOKIE
    b += _rec(0x0019, _mbcs(module_name))                      # MODULENAME
    b += _rec(0x0047, _u16(module_name))                       # MODULENAMEUNICODE
    b += _rec(0x001A, _mbcs(module_name))                      # MODULESTREAMNAME
    b += struct.pack("<HI", 0x0032, len(_u16(module_name))) + _u16(module_name)
    b += _rec(0x001C, b"")                                     # MODULEDOCSTRING
    b += _rec(0x0048, b"")                                     #   Reserved unicode
    b += _rec(0x0031, struct.pack("<I", 0))                    # MODULEOFFSET = 0
    b += _rec(0x001E, struct.pack("<I", 0))                    # MODULEHELPCONTEXT
    b += _rec(0x002C, struct.pack("<H", 0xFFFF))              # MODULECOOKIE
    b += _rec(0x0021, b"")                                     # MODULETYPE procedural
    b += struct.pack("<HI", 0x002B, 0)                         # module Terminator
    b += struct.pack("<HI", 0x0010, 0)                         # PROJECT Terminator
    return bytes(b)


def build_project_text(guid, module_name="Module1", project_name="VBAProject"):
    return (
        f'ID="{guid}"\r\n'
        f"Module={module_name}\r\n"
        f'Name="{project_name}"\r\n'
        'HelpContextID="0"\r\n'
        'VersionCompatible32="393222000"\r\n'
        "\r\n"
        "[Host Extender Info]\r\n"
        "&H00000001={3832D640-CF90-11CF-8E43-00A0C911005A};VBE;&H00000000\r\n"
        "\r\n"
        "[Workspace]\r\n"
        f"{module_name}=0, 0, 0, 0, C \r\n"
    ).encode("cp1252")


def build_projectwm(module_name="Module1"):
    return _mbcs(module_name) + b"\x00" + _u16(module_name) + b"\x00\x00" + b"\x00\x00"


def build_vba_project_stub():
    return b"\xCC\x61\xFF\xFF\x00\x00\x00"


# ─────────────────────────── Conteneur OLE/CFBF [MS-CFB] ───────────────────────
FREESECT, ENDOFCHAIN, FATSECT = 0xFFFFFFFF, 0xFFFFFFFE, 0xFFFFFFFD


def _cfb_key(name):
    return (len(name), name.upper().encode("utf-16-le"))


class _Entry:
    def __init__(self, name, etype):
        self.name, self.etype = name, etype
        self.left = self.right = self.child = 0xFFFFFFFF
        self.color = 1  # black
        self.start = ENDOFCHAIN
        self.size = 0
        self.data = b""


def _build_tree(ids, entries):
    """BST équilibrée triée par clé CFBF ; renvoie l'index racine."""
    ids = sorted(ids, key=lambda i: _cfb_key(entries[i].name))
    def rec(lo, hi):
        if lo > hi:
            return 0xFFFFFFFF
        mid = (lo + hi) // 2
        entries[ids[mid]].left = rec(lo, mid - 1)
        entries[ids[mid]].right = rec(mid + 1, hi)
        return ids[mid]
    return rec(0, len(ids) - 1)


def write_cfb(streams):
    """streams : dict {chemin: bytes}. Chemins type 'PROJECT', 'VBA/dir', ...
    Renvoie les octets du fichier composé."""
    SECT = 512
    MINI = 64
    CUTOFF = 4096

    # Construire les entrées de répertoire (arborescence)
    root = _Entry("Root Entry", 5)
    entries = [root]
    storages = {"": 0}

    # créer les storages intermédiaires
    def ensure_storage(path):
        if path in storages:
            return storages[path]
        parent, _, name = path.rpartition("/")
        ensure_storage(parent)
        e = _Entry(name, 1)
        entries.append(e)
        storages[path] = len(entries) - 1
        return storages[path]

    stream_ids = {}
    for path in streams:
        parent = path.rpartition("/")[0]
        if parent:
            ensure_storage(parent)

    children = {0: []}  # id -> list of child ids
    for path, sid in storages.items():
        if path == "":
            continue
        parent = path.rpartition("/")[0]
        children.setdefault(storages[parent], []).append(sid)
        children.setdefault(sid, [])

    for path, data in streams.items():
        e = _Entry(path.rpartition("/")[2], 2)
        e.data = data
        e.size = len(data)
        entries.append(e)
        sid = len(entries) - 1
        parent = storages[path.rpartition("/")[0]] if path.rpartition("/")[0] else 0
        children.setdefault(parent, []).append(sid)

    # lier les arbres enfants
    for pid, kids in children.items():
        if kids:
            entries[pid].child = _build_tree(kids, entries)

    # ─ Allouer les flux : mini (<4096) via mini-stream, sinon FAT ─
    mini_data = bytearray()
    big_streams = []  # (entry, data)
    for e in entries:
        if e.etype != 2:
            continue
        if e.size < CUTOFF:
            e.start = len(mini_data) // MINI
            mini_data += e.data
            pad = (-len(mini_data)) % MINI
            mini_data += b"\x00" * pad
        else:
            big_streams.append(e)

    # mini-FAT : une entrée par mini-secteur
    n_mini = len(mini_data) // MINI
    minifat = [FREESECT] * n_mini
    for e in entries:
        if e.etype == 2 and 0 < e.size < CUTOFF:
            count = max(1, -(-e.size // MINI))
            for k in range(count):
                ms = e.start + k
                minifat[ms] = (e.start + k + 1) if k < count - 1 else ENDOFCHAIN

    # ─ Disposition des secteurs (512) ─
    # Ordre : [flux volumineux...] [mini-stream] [minifat] [directory] [fat]
    sectors = []  # liste de blocs de 512
    def add_stream_sectors(data):
        if not data:
            return ENDOFCHAIN, 0
        first = len(sectors)
        n = -(-len(data) // SECT)
        for k in range(n):
            blk = data[k * SECT:(k + 1) * SECT]
            blk = blk + b"\x00" * (SECT - len(blk))
            sectors.append(blk)
        return first, n

    fat = []  # rempli après

    # 1) flux volumineux
    for e in big_streams:
        e.start, n = add_stream_sectors(e.data)

    # 2) mini-stream (propriété de Root)
    root.start, n_ministream_sect = add_stream_sectors(bytes(mini_data))
    root.size = len(mini_data)

    # 3) minifat
    minifat_bytes = b"".join(struct.pack("<I", x) for x in minifat)
    minifat_start, n_minifat_sect = add_stream_sectors(minifat_bytes) if minifat else (ENDOFCHAIN, 0)

    # 4) directory (128 octets/entrée, 4 par secteur)
    dir_bytes = bytearray()
    for e in entries:
        nm = e.name.encode("utf-16-le")[:62]
        nm += b"\x00\x00"
        nm += b"\x00" * (64 - len(nm))
        dir_bytes += nm
        dir_bytes += struct.pack("<H", len(e.name) * 2 + 2)
        dir_bytes += struct.pack("<BB", e.etype, e.color)
        dir_bytes += struct.pack("<III", e.left, e.right, e.child)
        dir_bytes += b"\x00" * 16  # CLSID
        dir_bytes += struct.pack("<I", 0)  # state
        dir_bytes += b"\x00" * 16  # times
        dir_bytes += struct.pack("<I", e.start & 0xFFFFFFFF)
        dir_bytes += struct.pack("<Q", e.size)
    # compléter le dernier secteur avec des entrées de répertoire vides (128 o)
    while len(dir_bytes) % SECT:
        empty = bytearray(128)
        struct.pack_into("<III", empty, 68, 0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF)
        dir_bytes += empty
    dir_start, n_dir_sect = add_stream_sectors(bytes(dir_bytes))

    # ─ Construire la FAT (chaînes) ─
    n_data_sectors = len(sectors)
    fat = [FREESECT] * n_data_sectors

    def chain(first, count):
        for k in range(count):
            fat[first + k] = (first + k + 1) if k < count - 1 else ENDOFCHAIN

    # re-chaîner d'après l'ordre d'ajout
    cursor = 0
    for e in big_streams:
        cnt = -(-len(e.data) // SECT)
        chain(cursor, cnt); cursor += cnt
    chain(cursor, n_ministream_sect); cursor += n_ministream_sect
    if minifat:
        chain(cursor, n_minifat_sect); cursor += n_minifat_sect
    chain(cursor, n_dir_sect); cursor += n_dir_sect

    # secteurs FAT eux-mêmes : ajoutés à la fin, marqués FATSECT
    # nombre de secteurs FAT nécessaires (itératif car la FAT se contient)
    n_fat = 1
    while True:
        total = n_data_sectors + n_fat
        need = -(-total * 4 // SECT)
        if need == n_fat:
            break
        n_fat = need
    # étendre la FAT pour les secteurs FAT
    fat += [FATSECT] * n_fat
    fat_start = n_data_sectors
    # padder la FAT à un multiple de 128 entrées (512/4)
    while len(fat) % (SECT // 4):
        fat.append(FREESECT)
    fat_bytes = b"".join(struct.pack("<I", x) for x in fat)
    for k in range(n_fat):
        sectors.append(fat_bytes[k * SECT:(k + 1) * SECT])

    # ─ En-tête ─
    header = bytearray(512)
    header[0:8] = b"\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1"
    struct.pack_into("<H", header, 24, 0x003E)   # minor version
    struct.pack_into("<H", header, 26, 0x0003)   # major version (512)
    struct.pack_into("<H", header, 28, 0xFFFE)   # byte order
    struct.pack_into("<H", header, 30, 0x0009)   # sector shift
    struct.pack_into("<H", header, 32, 0x0006)   # mini sector shift
    struct.pack_into("<I", header, 44, n_fat)    # number of FAT sectors
    struct.pack_into("<I", header, 48, dir_start)  # first directory sector
    struct.pack_into("<I", header, 56, CUTOFF)   # mini stream cutoff
    struct.pack_into("<I", header, 60, minifat_start if minifat else ENDOFCHAIN)
    struct.pack_into("<I", header, 64, n_minifat_sect if minifat else 0)
    struct.pack_into("<I", header, 68, ENDOFCHAIN)  # first DIFAT sector
    struct.pack_into("<I", header, 72, 0)        # number of DIFAT sectors
    # DIFAT (109 entrées) à l'offset 76
    difat = [FREESECT] * 109
    for k in range(n_fat):
        difat[k] = fat_start + k
    for k in range(109):
        struct.pack_into("<I", header, 76 + 4 * k, difat[k])

    return bytes(header) + b"".join(sectors)


def build_vbaproject(vba_source: str,
                     module_name="Module1",
                     project_name="VBAProject",
                     guid="{5DD0E456-4E22-4D2B-9C8F-1A2B3C4D5E6F}") -> bytes:
    src = vba_source.replace("\n", "\r\n").encode("cp1252")
    streams = {
        "PROJECT": build_project_text(guid, module_name, project_name),
        "PROJECTwm": build_projectwm(module_name),
        "VBA/_VBA_PROJECT": build_vba_project_stub(),
        "VBA/dir": ovba_compress(build_dir(project_name, module_name)),
        f"VBA/{module_name}": ovba_compress(src),
    }
    return write_cfb(streams)


if __name__ == "__main__":
    # auto-test compression + conteneur
    sample = b"Hello VBA " * 50
    assert ovba_decompress(ovba_compress(sample)) == sample, "compression KO"
    dirb = build_dir()
    assert ovba_decompress(ovba_compress(dirb)) == dirb, "dir round-trip KO"
    print("Compression OK. dir =", len(dirb), "octets.")
