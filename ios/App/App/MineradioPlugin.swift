import Foundation
import Capacitor

/**
 * Mineradio Native API Plugin
 * 负责处理 iOS 原生层面的加解密和网络请求，彻底摆脱 VPS
 */
@objc(MineradioPlugin)
public class MineradioPlugin: CAPPlugin {

    @objc func echo(_ call: CAPPluginCall) {
        let value = call.getString("value") ?? ""
        call.resolve([
            "value": value
        ])
    }

    @objc func neteaseRequest(_ call: CAPPluginCall) {
        let path = call.getString("path") ?? ""
        let params = call.getObject("params") ?? [:]
        
        // 这里将来会实现 NeteaseCloudMusicApi 的 Swift 版本加密逻辑
        // 目前先返回一个模拟数据
        print("[MineradioNative] Requesting Netease path: \(path)")
        
        call.resolve([
            "code": 200,
            "message": "Native Request Success (Stub)",
            "path": path
        ])
    }
}
