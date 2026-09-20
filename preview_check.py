from pathlib import Path
from playwright.sync_api import sync_playwright
import json

ROOT = Path(__file__).parent
shots = ROOT / 'screenshots'
shots.mkdir(exist_ok=True)
errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe', args=['--enable-webgl', '--ignore-gpu-blocklist'])
    page = browser.new_page(viewport={'width': 1440, 'height': 960}, device_scale_factor=1)
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto('http://127.0.0.1:5173')
    page.wait_for_load_state('networkidle')
    page.wait_for_function("window.__teaShop?.ready && document.querySelector('#loading').classList.contains('done')")
    page.wait_for_timeout(1200)
    print('buttons:', page.get_by_role('button').all_text_contents())
    page.screenshot(path=str(shots / '01-entry.png'))
    print('entry:', page.evaluate('window.__teaShop.getState()'))
    assert page.evaluate('window.__teaShop.getState().walkable')
    for key in ['order', 'display', 'lounge']:
        page.locator(f'[data-zone="{key}"]').click()
        page.wait_for_timeout(1400)
        page.screenshot(path=str(shots / f'{key}.png'))
        state = page.evaluate('window.__teaShop.getState()')
        assert state['zone'] == key
        assert state['walkable'], f'{key} begins outside walkable area: {state}'
        print(key, state)
    page.get_by_role('button', name='俯瞰全店 ↗').click()
    page.wait_for_timeout(500)
    assert page.evaluate('window.__teaShop.getState().overview')
    page.screenshot(path=str(shots / 'overview.png'))
    page.get_by_role('button', name='返回店内 ↙').click()
    page.locator('[data-zone="entry"]').click()
    page.wait_for_timeout(1400)
    before = page.evaluate('window.__teaShop.getState().position')
    page.keyboard.down('w')
    page.wait_for_timeout(500)
    page.keyboard.up('w')
    after = page.evaluate('window.__teaShop.getState().position')
    assert before != after, 'Keyboard walking failed'
    page.keyboard.down('w')
    page.wait_for_timeout(4000)
    page.keyboard.up('w')
    assert page.evaluate('window.__teaShop.getState().walkable'), 'Collision boundary failed'
    yaw = page.evaluate('window.__teaShop.getState().yaw')
    page.mouse.move(750, 450)
    page.mouse.down()
    page.mouse.move(950, 450, steps=10)
    page.mouse.up()
    assert yaw != page.evaluate('window.__teaShop.getState().yaw')
    page.locator('#light-btn').click()
    assert page.evaluate('window.__teaShop.getState().lightMode') == 'day'
    page.locator('#reference-btn').click()
    assert page.locator('#reference-dialog').is_visible()
    assert page.locator('#reference-dialog img').evaluate_all('(imgs)=>imgs.every(i=>i.complete && i.naturalWidth>0)')
    page.get_by_role('button', name='关闭设计参考').click()
    page.locator('#help-btn').click()
    assert page.locator('#help-dialog').is_visible()
    page.keyboard.press('Escape')
    with page.expect_download() as d:
        page.locator('#capture-btn').click()
    d.value.save_as(str(shots / 'download-check.png'))
    page.locator('#map-toggle').click()
    assert page.locator('#map-body').is_hidden()
    page.locator('#map-toggle').click()
    page.locator('#minimap').click(position={'x': 160, 'y': 50})
    page.wait_for_timeout(1300)
    mobile = browser.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1, is_mobile=True, has_touch=True)
    mobile.on('pageerror', lambda error: errors.append(str(error)))
    mobile.goto('http://127.0.0.1:5173')
    mobile.wait_for_load_state('networkidle')
    mobile.wait_for_function("window.__teaShop?.ready && document.querySelector('#loading').classList.contains('done')")
    mobile.wait_for_timeout(900)
    mobile.screenshot(path=str(shots / 'mobile.png'))
    mobile.locator('[data-zone="order"]').click()
    mobile.wait_for_timeout(1300)
    assert mobile.evaluate('window.__teaShop.getState().zone') == 'order'
    assert mobile.locator('#mobile-controls').is_visible()
    assert mobile.evaluate('document.documentElement.scrollWidth <= innerWidth')
    assert not errors, errors
    print(json.dumps({'passed': True, 'errors': errors, 'checks': ['4 viewpoints', 'walkable starts', 'walking', 'collision', 'drag look', 'overview', 'lighting', 'reference images', 'help', 'PNG download', 'minimap', 'mobile layout']}, ensure_ascii=False))
    browser.close()
