import { Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Page, PageTabsLayout } from 'tonwa-com';
import { AppLogin, AppRegister } from '../tool';
import { TabHome } from './Home';
import { routeBlogs } from './Blog';
import { routeFind } from './Find';
import { pathMe, routeMe, TabMe } from './Me';
import { TabFind } from './Find';
import { routeStock } from './StockInfo';
import { PageSpinner } from 'tonwa-com/page/PageSpinner';
import { routeSearch } from './Search';
import { pathPrivacy, PagePrivacy, routePrivacy } from 'app/tool';
import { routeAccount } from 'app/views/accounts/routeAccount';

export function ViewsRoutes() {
    const homeLayout = <PageTabsLayout tabs={[
        { to: '/', caption: '首页' },
        { to: '/find', caption: '发现' },
        { to: '/' + pathMe, caption: '我的' },
    ]} />;

    return <Suspense fallback={<PageSpinner />}>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={homeLayout}>
                    <Route index element={<TabHome />} />
                    <Route path="find" element={<TabFind />} />
                    <Route path={pathMe + '/*'} element={<TabMe />} />
                </Route>
                {routeMe}
                {routeFind}
                {routeStock}
                {routeAccount}
                <Route path="/test" element={<Page header="Test">test</Page>} />
                {routeBlogs}
                {routeSearch}
                <Route path="/login" element={<AppLogin />} />
                <Route path="/register" element={<AppRegister />} />
                {routePrivacy}
            </Routes>
        </BrowserRouter>
    </Suspense>;
}
