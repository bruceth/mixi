import React, { ReactNode, useContext, useState } from 'react';
import { proxy, ref, useSnapshot } from "valtio";
import jwtDecode from 'jwt-decode';
import { PageProps, PagePublic, useEffectOnce } from 'tonwa-com';
import { Guest, LocalDb, NetProps, UqConfig, User, UserApi } from 'tonwa-uq';
import { createUQsMan, Net, UqUnit, Uq, UserUnit, UQsMan } from "tonwa-uq";
import { env, LocalData } from 'tonwa-com';
import { Spinner } from 'tonwa-com';
import { uqsProxy } from './uq';
import { AutoRefresh } from './AutoRefresh';
import { QueryClient, QueryClientProvider } from 'react-query';

export interface AppConfig { //extends UqsConfig {
    center: string;
    version: string;        // 版本变化，缓存的uqs才会重载
    loginTop?: JSX.Element;
    oem?: string;               // 用户注册发送验证码的oem厂家，默认同花
    privacy?: string;
    noUnit?: boolean;			// app的运行，不跟unit绑定
    htmlTitle?: string;
    mustLogin?: boolean;
}

export interface RoleName {
    role?: string;
    caption: string;
    icon?: string;
    color?: string;
}

let uqAppId = 1;
export abstract class UqApp<U = any> {
    private readonly appConfig: AppConfig;
    private readonly uqConfigs: UqConfig[];
    private readonly uqsSchema: { [uq: string]: any; };
    //private readonly stores: Store[];          // 用于在同一个模块中传递
    private localData: LocalData;
    private roleNames: { [key: string]: RoleName };
    readonly uqAppBaseId: number;
    readonly net: Net;
    readonly userApi: UserApi;
    readonly version: string;    // version in appConfig;
    readonly mustLogin: boolean;
    //readonly responsive: {
    //    user: User;
    //}
    readonly state: { user: User; refreshTime: number; modalStack: any[]; };
    uqsMan: UQsMan;
    store: any;
    guest: number;
    uqs: U;
    // uq: Uq;
    uqUnit: UqUnit;
    pathLogin = '/login';

    constructor(appConfig: AppConfig, uqConfigs: UqConfig[], uqsSchema: { [uq: string]: any; }) {
        this.uqAppBaseId = uqAppId++;
        this.appConfig = appConfig;
        this.uqConfigs = uqConfigs;
        this.uqsSchema = uqsSchema;
        this.version = appConfig.version;
        this.mustLogin = appConfig.mustLogin !== false;
        /*
        this.responsive = proxy({
            user: undefined,
        });
        */
        // this.user = proxy({} as User);
        // this.stores = [];
        let props: NetProps = {
            center: appConfig.center,
            unit: env.unit,
            testing: env.testing,
            localDb: new LocalStorageDb(),
            createObservableMap: () => new Map(), //new ObservableMap(),
        }
        this.net = new Net(props);
        this.localData = new LocalData();

        this.userApi = this.net.userApi;
        let user = this.localData.user.get();
        this.state = proxy({
            user,
            refreshTime: Date.now() / 1000,
            modalStack: [],
        });
    }

    protected get defaultUqRoleNames(): { [lang: string]: any } { return undefined }
    loginUnit(userUnit: UserUnit) {
        this.uqUnit.loginUnit(userUnit);
    }
    logoutUnit() {
        this.uqUnit.logoutUnit();
    }
    get userUnit() { return this.uqUnit.userUnit; }
    // get me() { return this.user.read().user.read() return this.responsive.user?.id; }
    hasRole(role: string[] | string): boolean {
        if (this.uqUnit === undefined) return false;
        return this.uqUnit.hasRole(role);
    }

    async logined(user: User) {
        this.net.logoutApis();
        this.state.user = user;
        let autoLoader: Promise<any> = undefined;
        let autoRefresh = new AutoRefresh(this, autoLoader);
        if (user) {
            jwtDecode(user.token);
            this.net.setCenterToken(user.id, user.token);
        }
        else {
            this.net.clearCenterToken();
            this.uqUnit = undefined;
            autoRefresh.stop();
        }
        this.localData.user.set(user);
        if (user) {
            await this.loadOnLogined();
        }
    }

    async setUserProp(propName: string, value: any) {
        await this.userApi.userSetProp(propName, value);
        (this.state.user as any)[propName] = value;
        this.localData.user.set(this.state.user);
    }

    saveLocalData() {
        this.localData.saveToLocalStorage();
    }

    // private initCalled = false;
    initErrors: string[];
    /*
    init(initPage: React.ReactNode, navigateFunc: NavigateFunction): void {
        this.appNav.init(initPage, navigateFunc);
    }
    */

    async init(): Promise<void> {
        // if (this.initCalled === true) return;
        // this.initCalled = true;
        console.log('UqApp.load()');
        await this.net.init();
        console.log('await this.net.init()');
        try {
            let uqsMan = await createUQsMan(this.net, this.appConfig.version, this.uqConfigs, this.uqsSchema);
            console.log('createUQsMan');
            this.uqsMan = uqsMan;
            this.uqs = uqsProxy(uqsMan) as U;

            if (this.uqs) {
                // this.uq = this.defaultUq;
                // this.buildRoleNames();
            }
            // let user = this.localData.user.get();
            let { user } = this.state;
            // console.log('logined');
            if (!user) {
                let guest: Guest = this.localData.guest.get();
                if (guest === undefined) {
                    guest = await this.net.userApi.guest();
                }
                if (!guest) {
                    throw Error('guest can not be undefined');
                }
                this.net.setCenterToken(0, guest.token);
                this.localData.guest.set(guest);
                await this.loadWithoutLogin();
            }
            else {
                await this.loadWithoutLogin();
                await this.logined(user);
                // console.log('loadAfterLogin');
            }
        }
        catch (error) {
            console.error(error);
        }
    }

    protected loadWithoutLogin(): Promise<void> {
        return;
    }

    protected loadOnLogined(): Promise<void> {
        return;
    }

    /*
    private buildRoleNames() {
        if (this.uq === undefined) return;
        let defaultUqRoleNames = this.defaultUqRoleNames;
        if (defaultUqRoleNames !== undefined) {
            this.roleNames = defaultUqRoleNames[env.lang];
            if (this.roleNames === undefined) {
                this.roleNames = defaultUqRoleNames['$'];
            }
        }
        if (this.roleNames === undefined) this.roleNames = {};
    }

    roleName(role: string): RoleName {
        return this.roleNames[role];
    }
    */
}

class LocalStorageDb extends LocalDb {
    getItem(key: string): string {
        return localStorage.getItem(key);
    }
    setItem(key: string, value: string): void {
        localStorage.setItem(key, value);
    }
    removeItem(key: string): void {
        localStorage.removeItem(key);
    }
}

export function useModal() {
    let { state } = useUqAppBase();
    async function openModal<T = any>(element: JSX.Element, caption?: string | JSX.Element): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            if (React.isValidElement(element) !== true) {
                alert('is not valid element');
                return;
            }
            function Modal() {
                const { closeModal } = useModal();
                return <PagePublic
                    onBack={() => closeModal(undefined)}
                    back={'close'}>{element}</PagePublic>;
            }
            state.modalStack.push(ref([<Modal />, resolve]));
        })
    }
    function closeModal(result: any) {
        let [el, resolve] = state.modalStack.pop();
        resolve(result);
    }
    return { openModal, closeModal, }
}

export const UqAppContext = React.createContext(undefined);
export function useUqAppBase() {
    return useContext<UqApp>(UqAppContext);
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            suspense: true,
        },
    },
});

export function ViewUqApp({ uqApp, children }: { uqApp: UqApp; children: ReactNode; }) {
    const { modalStack } = useSnapshot(uqApp.state);
    let [appInited, setAppInited] = useState<boolean>(false);
    useEffectOnce(() => {
        (async function () {
            await uqApp.init();
            setAppInited(true);
        })();
    });
    if (appInited === false) {
        return <div className="p-5 text-center">
            <Spinner className="text-info" />
        </div>;
    }
    if (uqApp.initErrors) {
        return <div>
            <div>uq app start failed. init errors: </div>
            <ul className="text-danger">
                {
                    uqApp.initErrors.map((v: string, index: number) => <li key={index}>{v}</li>)
                }
            </ul>
        </div>;
    }
    let len = modalStack.length;
    let cnMain = len === 0 ? '' : 'd-none';
    return <UqAppContext.Provider value={uqApp}>
        <QueryClientProvider client={queryClient}>
            {<div className={cnMain + ' h-100'}>{children}</div>}
            {
                modalStack.map((v, index) => {
                    let cn = index < len - 1 ? 'd-none' : '';
                    let [el] = v;
                    return <React.Fragment key={index}>
                        <div className={cn + ' h-100'}>{el}</div>
                    </React.Fragment>;
                })
            }
        </QueryClientProvider>
    </UqAppContext.Provider>;
}
