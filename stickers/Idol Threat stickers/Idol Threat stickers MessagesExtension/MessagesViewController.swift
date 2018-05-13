//
//  MessagesViewController.swift
//  Idol Threat stickers MessagesExtension
//
//  Created by colons on 13/05/2018.
//  Copyright © 2018 Very Scary Scenario. All rights reserved.
//

import UIKit
import Messages

class MessagesViewController: MSMessagesAppViewController {
    var browserViewController: IdolThreatStickerBrowserViewController!
    @IBOutlet weak var browserViewContainer: UIView!
    
    override func viewDidLoad() {
        super.viewDidLoad()

        browserViewController = IdolThreatStickerBrowserViewController(stickerSize: .large)
        browserViewController.view.frame = self.view.frame

        self.addChildViewController(browserViewController)
        browserViewController.didMove(toParentViewController: self)
        browserViewContainer.addSubview(browserViewController.view)

        browserViewController.stickerBrowserView.reloadData()
    }
    
    @IBAction func reroll(_ sender: Any) {
        browserViewController.stickerBrowserView.reloadData()
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
}
