import {expect,test} from '@playwright/test';
import {boot,scan,watchPageErrors,expectBaselineNotStale,reportCollected} from './gate';
for(const width of [1280,320])test(`production page: reachable states pass WCAG A/AA at ${width}px`,async({page})=>{
 test.setTimeout(900000);const errors=watchPageErrors(page);await page.setViewportSize({width,height:900});await boot(page);await scan(page,'arrival');
 await page.locator('#clock').click();await scan(page,'clocked byte');
 await page.locator('#break-button').click();await expect(page.locator('#break-button')).toBeEnabled();await scan(page,'recovery or public ambiguity');
 await page.locator('#known-count').fill('3');await scan(page,'retired inputs');await page.locator('#break-button').click();await expect(page.locator('#break-button')).toBeEnabled();await scan(page,'three-byte ambiguity');
 await page.getByText('Supply public bytes by hand',{exact:true}).click();await page.locator('#manual-bytes').fill('00 00');await page.locator('#break-button').click();await scan(page,'short input refused');
 await page.locator('#manual-bytes').fill('00 00 00 00 00 00 00 00');await page.locator('#break-button').click();await expect(page.locator('#break-button')).toBeEnabled();await scan(page,'zero survivors');
 await page.evaluate(()=>{document.getElementById('break-button')!.click();document.getElementById('cancel')!.click()});await scan(page,'cancelled search');
 await page.locator('#profile').click();await expect(page.locator('#profile')).toBeEnabled({timeout:30000});await scan(page,'survivor histogram');
 await page.getByText('Sources and related labs',{exact:true}).click();await scan(page,'sources open');await page.locator('.cl-skip-link').focus();await scan(page,'focused skip link');expect(errors).toEqual([]);expectBaselineNotStale();reportCollected();
});
