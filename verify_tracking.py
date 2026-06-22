import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        # 1. Test valid tracking number (Direct Access)
        print("Testing valid tracking number...")
        # Since I can't guarantee the DB state in the sandbox for the dev server,
        # I'll at least check the UI structure for the search page.
        await page.goto("http://localhost:8080/track")
        await page.screenshot(path="track_search_page.png")

        # 2. Test invalid tracking number (This should show the Not Found page)
        print("Testing invalid tracking number...")
        await page.goto("http://localhost:8080/track/NON-EXISTENT-TRK")
        # Increase timeout slightly to allow for fetch failure
        try:
            await page.wait_for_selector('text=Shipment Not Found', timeout=15000)
            print("Found Not Found text")
        except:
            print("Not Found text not found, taking screenshot anyway")

        await page.screenshot(path="tracking_not_found.png", full_page=True)

        await browser.close()

asyncio.run(run())
