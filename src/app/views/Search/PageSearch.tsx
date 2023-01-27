import { PageQueryMore } from "app/coms";
import { ViewStockRow } from "app/coms/ItemViewStock";
import { useUqApp } from "app/MyUqApp";
import { useRef, useState } from "react";
import { FA, LMR, useNav } from "tonwa-com";
import { Stock, StockValue } from "uqs/BrMi";
import { ItemViewStock } from "../Find";
import { PageStockInfo } from "../StockInfo";

type SearchOrder = 'miRateDesc' | 'miRateAsc' | 'dvRateDesc' | 'dvRateAsc' | 'roeDesc' | 'roeAsc';
const cnStar = 'small border rounded py-1 px-2 me-3 ';
export function PageSearch({ header, searchKey, markets }: { header?: string; searchKey: string; markets: string[]; }) {
    const uqApp = useUqApp();
    const nav = useNav();
    // const storeSearch = useInitPageStore(() => new StoreSearch(searchKey, markets))
    // const { items } = useSnapshot(storeSearch.state);
    const tickReload = useRef(1);
    const smoothRef = useRef(0);
    let [smooth, setSmooth] = useState(smoothRef.current)
    function changeSmooth(v: number) {
        ++tickReload.current;
        smoothRef.current = v;
        setSmooth(v);
    }
    function ViewStars() {
        let stars: number[] = [];
        for (let i = 0; i < 5; i++) stars[i] = 4 - i;
        return <LMR className="p-2">
            <div className="d-flex py-1">
                {
                    stars.map(v => {
                        let cn: string, icon: string;
                        if (v === smooth) {
                            icon = 'star';
                            cn = cnStar + ' text-warning border-primary bg-white';
                        }
                        else if (v < smooth) {
                            cn = cnStar + ' cursor-pointer text-muted ';
                            icon = 'star-o';
                        }
                        else {
                            cn = cnStar + ' cursor-pointer text-warning bg-white';
                            icon = 'star';
                        }
                        return <div key={v} className={cn} onClick={() => changeSmooth(v)}>
                            {v === 0 ? '全部' : <>{v}<FA name={icon} /></>}
                        </div>
                    })
                }
            </div>
            <div className="text-muted small py-1 ml-auto align-self-center">
                <FA name="star-o" /> 近五年分红增长持续度
            </div>
        </LMR>;
    }
    /*
    function onClick(stock: Stock & StockValue) {
        nav.open(<PageStockInfo stock={stock} />);
    }
    function ItemViewStockRight() {
        return <div>right</div>
    }
    function ItemViewStock({ value }: { value: Stock & StockValue }) {
        return <>
            {ViewStockRow((value as any)['$order'], value, onClick, <ItemViewStockRight />)}
        </>;
    }
    */
    /*
    async function onScrollBottom(scroller: Scroller) {
        console.log('onScrollBottom');
    }
    return <Page header="搜索" onScrollBottom={onScrollBottom}>
        <div className="pt-1 pb-3">
            <ViewStars />
            <List items={items}
                ItemView={ItemViewStock} />
        </div>
    </Page>
    */
    let searchOrder: SearchOrder = 'miRateDesc';
    let searchParam = {
        key: searchKey,
        market: markets?.join('\n'),
        $orderSwitch: searchOrder,
        smooth: (searchKey ? 0 : smoothRef.current) + 1,
    };
    return <PageQueryMore header={header ?? '搜索'} query={uqApp.uqs.BrMi.SearchStock}
        param={searchParam}
        sortField="$order"
        ItemView={ItemViewStock}
        tickReload={tickReload.current}
    >
        <ViewStars />
    </PageQueryMore>
}
