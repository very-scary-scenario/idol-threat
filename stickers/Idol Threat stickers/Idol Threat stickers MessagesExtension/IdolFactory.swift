//
//  IdolFactory.swift
//  Idol Threat stickers MessagesExtension
//
//  Created by colons on 13/05/2018.
//  Copyright © 2018 Very Scary Scenario. All rights reserved.
//

import Foundation
import CoreImage
import UIKit

let LAYERS = [
    "hbe",
    "hb",
    "bd",
    "cb",
    "ct",
    "hd",
    "hf",
    "hfe",
    "ah",
    "mt",
    "ns",
    "ey",
    "eb",
]

struct IdolPart: Codable {
    var path: String
    var thumbPath: String
    var medPath: String
    var bodytype: String
    var layer: String
    var number: String
    var pose: String?
    var hairColour: String?
    var skinColour: String?
}

struct PartsInfo: Codable {
    var parts: [String: [IdolPart]]
    var poses: [String]
    var skinColours: [String]
    var hairColours: [String]
}

func choice(from: [Any]) -> Any {
    return from[Int(arc4random_uniform(UInt32(from.count)))]
}

class IdolFactory {
    let context = CIContext()
    var partsInfo: PartsInfo
    
    init() {
        let data = try! Data(contentsOf: URL(fileURLWithPath: "\(Bundle.main.bundlePath)/parts.json"), options: .mappedIfSafe)
        partsInfo = try! JSONDecoder().decode(PartsInfo.self, from: data)
    }
    
    func getParts() -> [IdolPart] {
        var parts = [IdolPart]()

        var skinColour: String
        var hairColour: String
        var pose: String
        
        var partsMissing: Bool
        partsMissing = true
        
        func partIsAllowed(_ part: IdolPart) -> Bool {
            if part.pose != nil && (part.pose != pose) { return false }
            if part.hairColour != nil && (part.hairColour != hairColour) { return false }
            if part.skinColour != nil && (part.skinColour != skinColour) { return false }
            return true
        }
        
        while (partsMissing) {
            partsMissing = false
            parts = [IdolPart]()
            
            skinColour = choice(from: partsInfo.skinColours) as! String
            hairColour = choice(from: partsInfo.hairColours) as! String
            pose = choice(from: partsInfo.poses) as! String
            
            for layerName in LAYERS {
                let options = partsInfo.parts[layerName]!.filter(partIsAllowed)
                if options.count == 0 {
                    partsMissing = true
                    break
                } else {
                    parts.append(choice(from: options) as! IdolPart)
                }
            }
        }
        
        return parts
    }

    func getIdolImage() -> CIImage {
        let idolParts = self.getParts()
        var image = CIImage(contentsOf: URL(fileURLWithPath: "\(Bundle.main.bundlePath)/\(idolParts[0].medPath)"))!

        for idolPart in idolParts[1...] {
            image = CIImage(contentsOf: URL(fileURLWithPath: "\(Bundle.main.bundlePath)/\(idolPart.medPath)"))!.composited(over: image)
        }
        
        return image
    }

    func getIdolImageURL() -> URL {
        let fileURL = FileManager.default.temporaryDirectory.appendingPathComponent("\(UUID().uuidString).png")
        print(fileURL)

        do {
           try FileManager.default.removeItem(at: fileURL)
        } catch {
            print(error)
        }

        try! context.writePNGRepresentation(of: self.getIdolImage(), to: fileURL, format: kCIFormatRGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)

        do {
            //return [FileAttributeKey : Any]
            let attr = try FileManager.default.attributesOfItem(atPath: fileURL.path)
            print("the file is: \(attr[FileAttributeKey.size] as! UInt64)")
        } catch {
            print("Error: \(error)")
        }

        return fileURL
    }
}
