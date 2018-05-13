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

class IdolThreatStickerBrowserViewController: MSStickerBrowserViewController {
    let idolFactory = IdolFactory()
    
    override func numberOfStickers(in stickerBrowserView: MSStickerBrowserView) -> Int {
        return 1;
    }
    
    override func stickerBrowserView(_ stickerBrowserView: MSStickerBrowserView, stickerAt index: Int) -> MSSticker {


        return try! MSSticker(contentsOfFileURL: idolFactory.getIdolImageURL(), localizedDescription: "an idol")
    }
}
