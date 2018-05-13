//
//  IdolThreatStickerBrowserViewController.swift
//  Idol Threat stickers MessagesExtension
//
//  Created by colons on 13/05/2018.
//  Copyright © 2018 Very Scary Scenario. All rights reserved.
//

import Foundation
import UIKit
import Messages

let idolFactory = IdolFactory()

func getSticker() -> MSSticker {
    return try! MSSticker(contentsOfFileURL: idolFactory.getIdolImageURL(), localizedDescription: "an idol")
}

class IdolThreatStickerBrowserViewController: MSStickerBrowserViewController {
    var currentSticker = getSticker()

    override func numberOfStickers(in stickerBrowserView: MSStickerBrowserView) -> Int {
        return 1;
    }
    
    func refresh() {
        self.currentSticker = getSticker()
    }
    
    override func stickerBrowserView(_ stickerBrowserView: MSStickerBrowserView, stickerAt index: Int) -> MSSticker {
        return self.currentSticker
    }
}
