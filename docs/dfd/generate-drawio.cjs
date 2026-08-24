/**
 * Dip Drip DFD — Thai academic style (ตามตัวอย่างมหาวิทยาลัย)
 * Entity = สี่เหลี่ยม | Process = กล่องมุมโค้งแบ่ง 2 ช่อง | Data Store = เส้นคู่ + กล่อง D# เทา
 */
const fs = require('fs')
const path = require('path')

const OUT = __dirname
let id = 2
const nid = () => String(id++)
const reset = () => { id = 2 }
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const EDGE = 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;fontSize=11;fontFamily=Tahoma;endArrow=blockThin;endFill=1;strokeColor=#333333;strokeWidth=1.2;labelBackgroundColor=#ffffff;'

function cell(cid, val, x, y, w, h, style) {
  return `<mxCell id="${cid}" value="${esc(val)}" style="${style}" vertex="1" parent="1">
  <mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`
}

/** External Entity — วงรี (Oval) ตามแบบ a. Customer / b. Admin */
function entity(cid, name, x, y, w = 120, h = 58) {
  return cell(cid, name, x, y, w, h,
    'shape=ellipse;perimeter=ellipsePerimeter;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.5;fontSize=13;fontFamily=Arial;fontStyle=1;align=center;verticalAlign=middle;')
}

/** Process — สี่เหลี่ยมขอบตรงแบ่ง 2 ช่อง (เลขบน / ชื่อตัวหนาล่าง) */
function process(cid, num, name, x, y, w = 210, h = 68) {
  const v = `<div style='border-bottom:1.5px solid #000;padding:4px 2px;text-align:center;font-family:Arial;font-size:13px;'>${num}</div>`
    + `<div style='padding:8px 6px;text-align:center;font-family:Arial;font-size:12px;font-weight:bold;line-height:1.35'>${name}</div>`
  return cell(cid, v, x, y, w, h,
    'rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.5;overflow=hidden;')
}

/** Data Store — กล่องเปิดขวา เส้นคู่ขนาน (รหัส D# ซ้าย + ชื่อแฟ้มขวา สีแดง) */
function datastore(cid, code, label, x, y, w = 230, h = 42) {
  const v = `<div style='display:flex;align-items:stretch;height:100%;font-family:Arial'>`
    + `<div style='width:40px;border-right:1.5px solid #000;display:flex;align-items:center;justify-content:center;font-size:12px;color:#c2410c;'>${code}</div>`
    + `<div style='flex:1;display:flex;align-items:center;padding:0 8px;font-size:12px;color:#c2410c;'>${label}</div></div>`
  return cell(cid, v, x, y, w, h,
    'shape=partialRectangle;whiteSpace=wrap;html=1;left=0;right=0;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.5;overflow=hidden;')
}

function flow(label, src, tgt) {
  return `<mxCell id="${nid()}" value="${esc(label)}" style="${EDGE}" edge="1" parent="1" source="${src}" target="${tgt}">
  <mxGeometry relative="1" as="geometry"/></mxCell>`
}

function biFlow(labelAB, labelBA, a, b) {
  return [flow(labelAB, a, b), flow(labelBA, b, a)]
}

function page(name, w, h, fn) {
  return { name, w, h, cells: fn }
}

function buildPage(p) {
  reset()
  const slug = p.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
  return `<diagram name="${esc(p.name)}" id="${slug}">
  <mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${p.w}" pageHeight="${p.h}" background="#ffffff" math="0" shadow="0">
    <root><mxCell id="0"/><mxCell id="1" parent="0"/>
      ${p.cells().join('\n      ')}
    </root>
  </mxGraphModel></diagram>`
}

// ─── L0 Context ────────────────────────────────────────────────
const l0 = page('L0 · Context Diagram', 900, 520, () => {
  const c = 'c1', a = 'a1', s = 's0'
  return [
    entity(c, 'a.<br>Customer', 60, 220),
    entity(a, 'b.<br>Admin', 720, 60),
    process(s, '0', 'ระบบ Dip Drip E-Commerce', 310, 200, 240, 72),
    flow('ข้อมูลสมาชิก', c, s),
    flow('คำขอสินค้า/ตะกร้า', c, s),
    flow('คำสั่งซื้อ/สลิป', c, s),
    flow('คำขอเติม-ถอนเงิน', c, s),
    flow('คำขอสุ่ม Gacha', c, s),
    flow('รีวิว/ตั๋วสนับสนุน', c, s),
    flow('ข้อมูลสินค้า/โปร/สถิติ', s, c),
    flow('ผลสั่งซื้อ/ผลสุ่ม', s, c),
    flow('ยอดเงิน/ประวัติ', s, c),
    flow('คำตอบสนับสนุน', s, c),
    flow('คำสั่งจัดการระบบ', a, s),
    flow('คำขออนุมัติ', a, s),
    flow('รายงาน/รายการรอ', s, a),
    flow('สถานะออเดอร์/ผู้ใช้', s, a),
  ]
})

// ─── L1 — layout แบบตัวอย่าง: Process กลาง | Data Store ขวา ───
const l1 = page('L1 · System Decomposition', 980, 920, () => {
  const admin = 'admin', user = 'user'
  const px = 250, py = 80, dy = 88, pw = 220, ph = 64
  const dx = 620, dw = 250, dh = 42

  const items = [
    ['p1', '1', 'การจัดการข้อมูลผู้ใช้', 'd1', 'D1', 'ข้อมูลผู้ใช้/Session'],
    ['p2', '2', 'การจัดการข้อมูลสินค้า', 'd2', 'D2', 'ข้อมูลสินค้า'],
    ['p3', '3', 'การจัดการคำสั่งซื้อ', 'd4', 'D4', 'ข้อมูลคำสั่งซื้อ'],
    ['p4', '4', 'การจัดการกระเป๋าเงิน', 'd5', 'D5', 'ข้อมูลคำขอเติมเงิน'],
    ['p5', '5', 'การจัดการ Gacha', 'd6', 'D6', 'ข้อมูลตู้สุ่ม'],
    ['p6', '6', 'การจัดการโปร/รีวิว', 'd7', 'D7', 'ข้อมูลโปรโมชั่น'],
    ['p7', '7', 'การจัดการ Support', 'd8', 'D8', 'ข้อมูลตั๋วสนับสนุน'],
    ['p8', '8', 'การจัดการระบบ Admin', 'd9', 'D9', 'ข้อมูลรีวิวสินค้า'],
  ]

  const cells = [
    entity(admin, 'b.<br>Admin', 60, 40),
    entity(user, 'a.<br>Customer', 780, 820),
  ]

  items.forEach(([pid, num, name, did, dcode, dlabel], i) => {
    const y = py + i * dy
    cells.push(process(pid, num, name, px, y, pw, ph))
    cells.push(datastore(did, dcode, dlabel, dx, y + 10, dw, dh))
    cells.push(...biFlow('ข้อมูล', 'ข้อมูล', pid, did))
  })

  // Extra data stores (cart)
  cells.push(datastore('d3', 'D3', 'ข้อมูลตะกร้าสินค้า', dx, py + dy + 10, dw, dh))
  cells.push(...biFlow('ข้อมูลตะกร้า', 'ข้อมูลตะกร้า', 'p2', 'd3'))

  // Admin flows
  cells.push(flow('คำสั่งจัดการระบบ', admin, 'p8'))
  cells.push(flow('รายงาน/สถานะ', 'p8', admin))
  cells.push(flow('คำสั่งจัดการ', admin, 'p1'))
  cells.push(flow('รายงานผู้ใช้', 'p1', admin))
  cells.push(flow('ข้อมูลสินค้า', admin, 'p2'))
  cells.push(flow('รายงานสินค้า', 'p2', admin))
  cells.push(flow('คำสั่งอนุมัติ', admin, 'p3'))
  cells.push(flow('รายงานออเดอร์', 'p3', admin))
  cells.push(flow('คำสั่งอนุมัติ', admin, 'p4'))
  cells.push(flow('รายงานเติมเงิน', 'p4', admin))

  // User flows
  cells.push(flow('ข้อมูลสมาชิก', user, 'p1'))
  cells.push(flow('ข้อมูลสินค้า/ตะกร้า', user, 'p2'))
  cells.push(flow('คำสั่งซื้อ/สลิป', user, 'p3'))
  cells.push(flow('คำขอเติม-ถอน', user, 'p4'))
  cells.push(flow('คำขอสุ่ม', user, 'p5'))
  cells.push(flow('รีวิว', user, 'p6'))
  cells.push(flow('ตั๋วสนับสนุน', user, 'p7'))
  cells.push(flow('ข้อมูลสินค้า/โปร', 'p2', user))
  cells.push(flow('ผลสั่งซื้อ', 'p3', user))
  cells.push(flow('ยอดเงิน/ประวัติ', 'p4', user))
  cells.push(flow('ผลสุ่ม', 'p5', user))
  cells.push(flow('รายงานโปร/รีวิว', 'p6', user))
  cells.push(flow('คำตอบสนับสนุน', 'p7', user))

  return cells
})

// ─── L2 template — Process กลาง + Data Store ขวา ─────────────
function l2(name, num, title, pairs, entityFlows) {
  return page(name, 900, 120 + pairs.length * 88 + 80, () => {
    const admin = 'admin', user = 'user'
    const px = 230, py = 70, dy = 82, pw = 220, ph = 64
    const dx = 580, dw = 250, dh = 42
    const cells = []

    if (entityFlows.hasAdmin) cells.push(entity(admin, 'b.<br>Admin', 50, 30))
    if (entityFlows.hasUser) cells.push(entity(user, 'a.<br>Customer', 720, 70 + pairs.length * dy))

    pairs.forEach(([pid, pnum, pname, did, dcode, dlabel], i) => {
      const y = py + i * dy
      cells.push(process(pid, pnum, pname, px, y, pw, ph))
      cells.push(datastore(did, dcode, dlabel, dx, y + 10, dw, dh))
      cells.push(...biFlow('ข้อมูล', 'ข้อมูล', pid, did))
    })

    entityFlows.flows.forEach(([label, src, tgt]) => cells.push(flow(label, src, tgt)))
    return cells
  })
}

const l2auth = l2('L2 · 1.0 Auth', '1', 'Auth', [
  ['p11', '1.1', 'สมัครสมาชิก', 'd1', 'D1', 'ข้อมูลผู้ใช้'],
  ['p12', '1.2', 'เข้าสู่ระบบ', 'd1s', 'D1', 'ข้อมูล Session'],
  ['p13', '1.3', 'จัดการโปรไฟล์', 'd1b', 'D1', 'ข้อมูลผู้ใช้'],
  ['p14', '1.4', 'ตรวจสอบ Session', 'd1c', 'D1', 'ข้อมูล Session'],
], {
  hasAdmin: false, hasUser: true,
  flows: [
    ['ข้อมูลสมาชิก', 'user', 'p11'], ['ข้อมูลเข้าสู่ระบบ', 'user', 'p12'],
    ['ข้อมูลโปรไฟล์', 'user', 'p13'], ['token คำขอ', 'user', 'p14'],
    ['สถานะยืนยัน', 'p14', 'user'],
  ]
})

const l2prod = l2('L2 · 2.0 Products', '2', 'Products', [
  ['p21', '2.1', 'ดูรายการสินค้า', 'd2', 'D2', 'ข้อมูลสินค้า'],
  ['p22', '2.2', 'ดูรายละเอียดสินค้า', 'd2b', 'D2', 'ข้อมูลสินค้า'],
  ['p23', '2.3', 'จัดการตะกร้า', 'd3', 'D3', 'ข้อมูลตะกร้า'],
], {
  hasAdmin: false, hasUser: true,
  flows: [
    ['เงื่อนไขค้นหา', 'user', 'p21'], ['รายการสินค้า', 'p21', 'user'],
    ['รหัสสินค้า', 'user', 'p22'], ['รายละเอียดสินค้า', 'p22', 'user'],
    ['รายการตะกร้า', 'user', 'p23'], ['สถานะตะกร้า', 'p23', 'user'],
  ]
})

const l2ord = l2('L2 · 3.0 Orders', '3', 'Orders', [
  ['p31', '3.1', 'ตรวจตะกร้า/สต็อก', 'd3', 'D3', 'ข้อมูลตะกร้า'],
  ['p32', '3.2', 'คำนวณราคา/โปร', 'd7', 'D7', 'ข้อมูลโปรโมชั่น'],
  ['p33', '3.3', 'ชำระ Wallet', 'd4', 'D4', 'ข้อมูลคำสั่งซื้อ'],
  ['p34', '3.4', 'ชำระ QR/สลิป', 'd4b', 'D4', 'ข้อมูลคำสั่งซื้อ'],
  ['p35', '3.5', 'อนุมัติออเดอร์', 'd1', 'D1', 'ข้อมูลผู้ใช้'],
], {
  hasAdmin: true, hasUser: true,
  flows: [
    ['คำสั่งซื้อ', 'user', 'p31'], ['สลิปชำระ', 'user', 'p34'],
    ['ผลสั่งซื้อ', 'p33', 'user'], ['รอยืนยัน', 'p34', 'user'],
    ['คำสั่งอนุมัติ', 'admin', 'p35'], ['ผลอนุมัติ', 'p35', 'admin'],
    ['รายการสินค้า', 'p31', 'p32'], ['ยอดชำระ', 'p32', 'p33'], ['ยอดชำระ', 'p32', 'p34'],
  ]
})

const l2wal = l2('L2 · 4.0 Wallet', '4', 'Wallet', [
  ['p41', '4.1', 'ขอเติมเงิน', 'd5', 'D5', 'ข้อมูลคำขอเติมเงิน'],
  ['p42', '4.2', 'อนุมัติเติมเงิน', 'd1', 'D1', 'ข้อมูลผู้ใช้'],
  ['p43', '4.3', 'ขอถอนเงิน', 'd1b', 'D1', 'ข้อมูลผู้ใช้'],
  ['p44', '4.4', 'อนุมัติถอนเงิน', 'd1c', 'D1', 'ข้อมูลผู้ใช้'],
], {
  hasAdmin: true, hasUser: true,
  flows: [
    ['คำขอเติม+สลิป', 'user', 'p41'], ['คำขอถอน', 'user', 'p43'],
    ['คำสั่งอนุมัติ', 'admin', 'p42'], ['คำสั่งอนุมัติ', 'admin', 'p44'],
    ['ยอดเงิน/ประวัติ', 'p42', 'user'],
  ]
})

const l2gacha = l2('L2 · 5.0 Gacha', '5', 'Gacha', [
  ['p51', '5.1', 'ดูตู้สุ่ม', 'd6', 'D6', 'ข้อมูลตู้สุ่ม'],
  ['p52', '5.2', 'สุ่มรางวัล', 'd6b', 'D6', 'ข้อมูลตู้สุ่ม'],
  ['p53', '5.3', 'บันทึกผลรางวัล', 'd4', 'D4', 'ข้อมูลคำสั่งซื้อ'],
], {
  hasAdmin: false, hasUser: true,
  flows: [
    ['รหัสตู้', 'user', 'p51'], ['รายการตู้', 'p51', 'user'],
    ['คำขอสุ่ม', 'user', 'p52'], ['ผลสุ่ม', 'p52', 'p53'], ['ของรางวัล', 'p53', 'user'],
  ]
})

const l2promo = l2('L2 · 6.0 Promo', '6', 'Promo', [
  ['p61', '6.1', 'ดูโปรโมชั่น', 'd7', 'D7', 'ข้อมูลโปรโมชั่น'],
  ['p62', '6.2', 'เขียนรีวิว', 'd9', 'D9', 'ข้อมูลรีวิว'],
  ['p63', '6.3', 'ดู/ลบรีวิว', 'd9b', 'D9', 'ข้อมูลรีวิว'],
], {
  hasAdmin: true, hasUser: true,
  flows: [
    ['เงื่อนไขโปร', 'user', 'p61'], ['รายการโปร', 'p61', 'user'],
    ['ข้อมูลรีวิว', 'user', 'p62'], ['รายการรีวิว', 'p63', 'user'],
    ['คำสั่งลบ', 'admin', 'p63'],
    ['ประวัติซื้อ', 'p62', 'd4'],
  ]
})
// fix l2promo - d4 reference without creating store - add flow through p62 only, remove invalid d4 ref
l2promo.cells = () => {
  const admin = 'admin', user = 'user'
  const px = 230, py = 70, dy = 82, pw = 220, ph = 64, dx = 580, dw = 250, dh = 42
  const pairs = [
    ['p61', '6.1', 'ดูโปรโมชั่น', 'd7', 'D7', 'ข้อมูลโปรโมชั่น'],
    ['p62', '6.2', 'เขียนรีวิว', 'd9', 'D9', 'ข้อมูลรีวิว'],
    ['p63', '6.3', 'ดู/ลบรีวิว', 'd9b', 'D9', 'ข้อมูลรีวิว'],
  ]
  const cells = [entity(admin, 'b.<br>Admin', 50, 30), entity(user, 'a.<br>Customer', 720, 70 + pairs.length * dy)]
  pairs.forEach(([pid, pnum, pname, did, dcode, dlabel], i) => {
    const y = py + i * dy
    cells.push(process(pid, pnum, pname, px, y, pw, ph))
    cells.push(datastore(did, dcode, dlabel, dx, y + 10, dw, dh))
    cells.push(...biFlow('ข้อมูล', 'ข้อมูล', pid, did))
  })
  cells.push(datastore('d4', 'D4', 'ข้อมูลคำสั่งซื้อ', dx, py + dy + 52, dw, dh))
  cells.push(flow('ประวัติซื้อ', 'p62', 'd4'))
  cells.push(flow('ข้อมูลออเดอร์', 'd4', 'p62'))
  ;[
    ['เงื่อนไขโปร', 'user', 'p61'], ['รายการโปร', 'p61', 'user'],
    ['ข้อมูลรีวิว', 'user', 'p62'], ['รายการรีวิว', 'p63', 'user'],
    ['คำสั่งลบ', 'admin', 'p63'],
  ].forEach(([l, s, t]) => cells.push(flow(l, s, t)))
  return cells
}

const l2sup = l2('L2 · 7.0 Support', '7', 'Support', [
  ['p71', '7.1', 'เปิดตั๋ว', 'd8', 'D8', 'ข้อมูลตั๋วสนับสนุน'],
  ['p72', '7.2', 'สนทนา', 'd8b', 'D8', 'ข้อมูลข้อความ'],
  ['p73', '7.3', 'ตอบกลับ', 'd8c', 'D8', 'ข้อมูลตั๋วสนับสนุน'],
], {
  hasAdmin: true, hasUser: true,
  flows: [
    ['ข้อมูลตั๋ว', 'user', 'p71'], ['ข้อความ/รูป', 'user', 'p72'],
    ['ประวัติสนทนา', 'p72', 'user'], ['คำตอบแอดมิน', 'admin', 'p73'],
    ['คำตอบ', 'p73', 'user'],
  ]
})

const l2adm = page('L2 · 8.0 Admin', 900, 620, () => {
  const admin = 'admin'
  const px = 230, py = 70, dy = 82, pw = 220, ph = 64, dx = 580, dw = 250, dh = 42
  const pairs = [
    ['p81', '8.1', 'จัดการสินค้า', 'd2', 'D2', 'ข้อมูลสินค้า'],
    ['p82', '8.2', 'จัดการออเดอร์', 'd4', 'D4', 'ข้อมูลคำสั่งซื้อ'],
    ['p83', '8.3', 'จัดการผู้ใช้', 'd1', 'D1', 'ข้อมูลผู้ใช้'],
    ['p84', '8.4', 'จัดการโปร/Gacha', 'd7', 'D7', 'ข้อมูลโปรโมชั่น'],
    ['p85', '8.5', 'อนุมัติเงิน', 'd5', 'D5', 'ข้อมูลคำขอเติมเงิน'],
    ['p86', '8.6', 'รายงานยอดขาย', 'd4b', 'D4', 'ข้อมูลคำสั่งซื้อ'],
  ]
  const cells = [entity(admin, 'b.<br>Admin', 50, 30)]
  pairs.forEach(([pid, pnum, pname, did, dcode, dlabel], i) => {
    const y = py + i * dy
    cells.push(process(pid, pnum, pname, px, y, pw, ph))
    cells.push(datastore(did, dcode, dlabel, dx, y + 10, dw, dh))
    cells.push(...biFlow('ข้อมูล', 'ข้อมูล', pid, did))
    cells.push(flow('คำสั่งจัดการ', admin, pid))
    if (i === 5) cells.push(flow('รายงาน', pid, admin))
    else cells.push(flow('รายงาน', pid, admin))
  })
  cells.push(datastore('d6', 'D6', 'ข้อมูลตู้สุ่ม', dx, py + 3 * dy + 52, dw, dh))
  cells.push(flow('ข้อมูลตู้', 'p84', 'd6'))
  cells.push(flow('ข้อมูลตู้', 'd6', 'p84'))
  return cells
})

const diagrams = [
  { file: 'level-0-context.drawio', ...l0 },
  { file: 'level-1-decomposition.drawio', ...l1 },
  { file: 'level-2-auth.drawio', ...l2auth },
  { file: 'level-2-products-cart.drawio', ...l2prod },
  { file: 'level-2-orders.drawio', ...l2ord },
  { file: 'level-2-wallet.drawio', ...l2wal },
  { file: 'level-2-gacha.drawio', ...l2gacha },
  { file: 'level-2-promotions-reviews.drawio', ...l2promo },
  { file: 'level-2-support.drawio', ...l2sup },
  { file: 'level-2-admin.drawio', ...l2adm },
]

for (const d of diagrams) {
  fs.writeFileSync(path.join(OUT, d.file),
    `<?xml version="1.0" encoding="UTF-8"?>\n<mxfile host="app.diagrams.net" agent="dfd-thai-style" version="24.7.17">\n  ${buildPage(d)}\n</mxfile>`, 'utf8')
  console.log('✓', d.file)
}

const master = diagrams.map(d => buildPage(d)).join('\n  ')
fs.writeFileSync(path.join(OUT, 'dip-drip-full-system.drawio'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<mxfile host="app.diagrams.net" agent="dfd-thai-style" version="24.7.17">\n  ${master}\n</mxfile>`, 'utf8')
console.log('✓ dip-drip-full-system.drawio')
