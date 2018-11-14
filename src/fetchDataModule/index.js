import "isomorphic-fetch";
import { libraryConfig } from "../config";



export default class FetchDataModule {
    /*
     *  请求入口
    */
    static fetch({ apiName, params, headers }) {
        const {
            API_URL,
            getLoginFunc,
            pushLoginFunc,
            Alert,
        } = libraryConfig
        const login = getLoginFunc()
        if (apiName) {
            if (API_URL[apiName].needLogin && !login) {
                return new Promise(() => {
                    pushLoginFunc()
                })
            }
            return this.fetchData({ apiName, params, headers })
        } else {
            const text = 'fetch模块调用异常，请检查传递参数'
            Alert.alert(text)
            return Promise.reject(text)
        }
    }

    /*
     *  处理请求的接口
    */
    static fetchData({ apiName, params, headers }) {
        const {
            API_URL,
            showLoading,
            Alert,
        } = libraryConfig
        if (API_URL[apiName].showLoading) {
            showLoading()
        }
        if (API_URL[apiName].method == "GET") {
            return this.get({ apiName, params, headers });
        } else if (API_URL[apiName].method == "POST") {
            return this.post({ apiName, params, headers });
        } else {
            Alert.alertAction({
                title: '接口预定义信息错误',
                desc: `接口名:${apiName}${"\b"}错误类型:请求方式异常`,
                actions: [
                    {
                        text: "查看接口定义信息",
                        onPress: () => {
                            console.warn(
                                `接口预定义信息:}`,
                                API_URL[apiName]
                            );
                        }
                    },
                    {
                        text: "确定",
                        onPress: () => {
                            console.warn("请处理错误接口");
                        }
                    }
                ]
            })
        }
    }

    /*
     *  GET请求
    */
    static get({ apiName, params, headers }) {
        const {
            API_URL,
            getHeadersFunc,
            requestTimeout,
        } = libraryConfig
        const {
            mock,
            fetchUrl,
            mockFetchUrl,
        } = API_URL[apiName]
        const fetchHeaders = Object.assign({}, mock ? {} : getHeadersFunc(), { "Content-Type": "application/x-www-form-urlencoded" }, headers)
        const fetchParams = toQueryString(params)
        return fetchFix(
            fetch(mock ? mockFetchUrl : fetchUrl + "?" + fetchParams, {
                method: "GET",
                headers: fetchHeaders,
            }),
            {
                timeout: requestTimeout,
            }
        )
            .then(res => {
                return this.HandleRequestResults({
                    res,
                    apiName,
                    params,
                    fetchHeaders,
                    fetchParams,
                })
            })
    }

    /*
     *  POST请求
    */
    static post({ apiName, params, headers }) {
        const {
            API_URL,
            getHeadersFunc,
            requestTimeout,
        } = libraryConfig
        const {
            mock,
            fetchUrl,
            mockFetchUrl,
        } = API_URL[apiName]
        const fetchHeaders = Object.assign({}, mock ? {} : getHeadersFunc(), { "Content-Type": "application/x-www-form-urlencoded" }, headers)
        const fetchParams = toQueryString(params)
        return fetchFix(
            fetch(mock ? mockFetchUrl : fetchUrl, {
                method: "POST",
                headers: fetchHeaders,
                body: fetchParams
            }), {
                timeout: requestTimeout
            }
        )
            .then(res => {
                return this.HandleRequestResults({
                    res,
                    apiName,
                    params,
                    fetchHeaders,
                    fetchParams,
                })
            })

    }

    /*
     *  处理请求结果
     *  res.headers.map['content-type'][0]                      非debug
     *  res._bodyBlob.type                                      debug
    */
    static HandleRequestResults({ res, apiName, params, fetchHeaders, fetchParams }) {

        const {
            API_URL,
            hideLoading,
            APP_ROOT_CONFIG,
            Alert,
        } = libraryConfig

        const {
            env
        } = APP_ROOT_CONFIG

        if (API_URL[apiName].showLoading) {
            hideLoading()
        }
        //res.headers.map["content-type"][0].indexOf(`application/json`) === -1
        if (!res.ok) {
            res.text()
                .then(err => {
                    if (env.showNetWorkErrorInfo) {
                        Alert.alertAction({
                            title: '接口请求错误',
                            desc: `接口名:${API_URL[apiName].apiUrl}`,
                            actions: [
                                {
                                    text: "上报接口异常",
                                    onPress: () => {
                                        console.log('未开发接口异常上报');
                                        // this.ErrorApiFetch({
                                        //     apiName,
                                        //     errmsg: err,
                                        //     params,
                                        // })
                                    }
                                },
                                { text: "查看报错信息", onPress: () => console.warn(err) },
                            ]
                        })
                    }
                    if (env.defaultUploadNetWorkErrorInfo) {
                        Alert.alert("捕获到服务器返回数据类型异常，正在自动提交错误信息");
                        this.ErrorApiFetch({ apiName, errmsg: err, params })
                    }
                    if (API_URL[apiName].log) {
                        this.Log({
                            apiName,
                            success: false,
                            response: res,
                            error: err,
                            fetchHeaders,
                            fetchParams
                        })
                    }
                });
            return new Promise((resolve, reject) => { reject() })
        } else {
            return res.json()
                .then(result => {
                    if (API_URL[apiName].log) {
                        this.Log({
                            apiName,
                            success: true,
                            response: res,
                            result,
                            fetchHeaders,
                            fetchParams
                        })
                    }
                    return new Promise((resolve, reject) => {
                        resolve(result);
                    });
                })
        }
    }

    /*
     *  微信专用请求
    */
    static wechat(url, params, callback) {
        return fetch(url + "?" + toQueryString(params), {
            method: "GET",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        })
            .then(res => res.json())
            .then(data => {
                return new Promise(resolve => resolve(data))
            })
    }

    /*
     *  请求错误处理
    */
    static ErrorApiFetch({ apiName, errmsg, params }) {
        return Promise.resolve('错误处理功能暂时关闭')
        const {
            API_URL,
            APP_ROOT_CONFIG,
            ToastError,
            getHeadersFunc,
            ToastWarn,
            ToastInfo,
            Alert,
        } = libraryConfig
        const {
            developer,
            errorCollectApi,
            AppName,
            AppPlatform,
        } = APP_ROOT_CONFIG

        const errorApiDeveloper = developerVerification({
            developerName: API_URL[apiName].developer,
            developer,
        })

        fetch(errorCollectApi, {
            method: "POST",
            headers: Object.assign({}, getHeadersFunc(), { "Content-Type": "application/x-www-form-urlencoded" }),
            body: toQueryString({
                project: `${AppName}${AppPlatform}端`,
                post_author: errorApiDeveloper.name,
                server_return: errmsg,
                api_address: `${API_URL[apiName].method}:${API_URL[apiName].fetchUrl}?${toQueryString(params)}`,
                api_author: API_URL[apiName].author
            })
        })
            .then(res => {
                if (res.headers.map["content-type"][0] != `application/json; charset=utf-8`) {
                    Alert.alert("提交错误的接口都报错了", `肿么办ﾍ(;´Д｀ﾍ)`, [
                        {
                            text: "GG",
                            onPress: () => { ToastWarn('你选择了GG') }
                        }, {
                            text: "人肉联系开发人员",
                            onPress: () => {
                                Alert.alert(
                                    `接口的使用者是 ${errorApiDeveloper.name}`,
                                    '是否要拨打电话联系开发者',
                                    [
                                        {
                                            text: '取消',
                                            onPress: () => { }
                                        },
                                        {
                                            text: '拨打',
                                            onPress: () => {
                                                // Linking.openURL(`tel:${errorApiDeveloper.phone}`).catch(err => console.warn('拨打电话失败，请检查当前环境'));
                                            }
                                        },
                                    ]
                                )
                            }
                        }, {
                            text: "确定",
                            onPress: () => { }
                        }
                    ]);
                } else {
                    res.json()
                        .then(e => {
                            ToastInfo("服务器异常提交成功");
                        })
                }
            })
    }
    /*
     *  输出日志
    */
    static Log({ apiName, success, response, result, error, fetchHeaders, fetchParams }) {
        const {
            API_URL,
        } = libraryConfig
        console.log('************ 请求结果 start ************')
        console.log('接口定义信息')
        console.log(API_URL[apiName])
        console.log('请求头部')
        console.log(fetchHeaders)
        console.log('请求参数')
        console.log(fetchParams)
        console.log('接口响应结果');
        console.log(response)
        if (success) {
            console.log('接口返回数据');
            console.log(result)
        } else {
            console.log('接口返回错误');
            console.log(error)
        }
        console.log('************ 请求结果 end ************')
    }
}



// 获取开发者信息
const developerVerification = ({ developerName, developer }) => {
    const {
        Alert,
    } = libraryConfig
    if (developerName) {
        if (developer.allDeveloper[developerName]) {
            return developer.allDeveloper[developerName]
        } else {
            Alert.alert('检测到定义了错误的接口开发者，请审查APP_ROOT_NETWORK_CONFIG')
            return developer.main
        }
    } else {
        return developer.main
    }
}

const fetchFix = (fetch, { timeout }) => {
    return Promise.race([
        fetch,
        new Promise((resolve, reject) => {
            setTimeout(() => reject(new Error('request timeout')), timeout);
        })
    ]);
}

function toQueryString(obj) {
    return obj
        ? Object.keys(obj)
            .sort()
            .map(function (key) {
                var val = obj[key];
                if (Array.isArray(val)) {
                    return val
                        .sort()
                        .map(function (val2) {
                            return encodeURIComponent(key) +
                                "[]=" +
                                encodeURIComponent(val2);
                        })
                        .join("&");
                }
                if (val !== null && val !== undefined) {
                    return encodeURIComponent(key) +
                        "=" +
                        encodeURIComponent(val);
                } else {
                    return encodeURIComponent(key) + "=";
                }
            })
            .join("&")
        : "";
}
