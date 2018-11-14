let libraryConfig = {
    Alert: {
        alert: (title) => {
            alert(title)
        },
        alertAction: () => {
            alert('alertAction')
        },
    },
    API_URL: null,
    getLoginFunc: () => {
        alert('未设置 getLoginFunc 方法')
    },
    pushLoginFunc: () => {
        alert('未设置 pushLoginFunc 方法')
    },
    APP_ROOT_CONFIG: null,
    showLoading: () => {
        alert('未设置 showLoading 方法')
    },
    hideLoading: () => {
        alert('未设置 hideLoading 方法')
    },
    getHeadersFunc: () => {
        alert('未设置 getHeadersFunc 方法')
    },
    requestTimeout: 5000,
}

const initLibraryConfigFunc = (e = {}) => {
    libraryConfig = Object.assign({}, libraryConfig, e)
}

const config = libraryConfig

export {
    libraryConfig,
    config,
    initLibraryConfigFunc
}
