import UIKit
import Capacitor

/// Pins the WKWebView so rubber-band overscroll cannot reveal native black edges.
final class AppBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        hardenWebViewScroll()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        hardenWebViewScroll()
    }

    private func hardenWebViewScroll() {
        guard let scrollView = webView?.scrollView else { return }
        scrollView.bounces = false
        scrollView.alwaysBounceVertical = false
        scrollView.alwaysBounceHorizontal = false
        scrollView.contentInsetAdjustmentBehavior = .never
        // Match light --bg (#f5f7f6); residual flash should never be black.
        let bg = UIColor(red: 245 / 255, green: 247 / 255, blue: 246 / 255, alpha: 1)
        webView?.backgroundColor = bg
        webView?.isOpaque = true
        scrollView.backgroundColor = bg
    }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = AppBridgeViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
