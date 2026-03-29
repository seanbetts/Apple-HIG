---
title: "Gyroscope and accelerometer"
source_url: "https://developer.apple.com/design/human-interface-guidelines/gyro-and-accelerometer"
canonical_path: "/gyro-and-accelerometer"
description: "On-device gyroscopes and accelerometers can supply data about a device’s movement in the physical world."
section: "Human Interface Guidelines"
breadcrumbs:
  - "Human Interface Guidelines"
  - "Gyroscope and accelerometer"
apple_changes: []
internal_links:
  - "/feedback"
external_links:
  - "https://developer.apple.com/documentation/CoreMotion"
  - "https://developer.apple.com/documentation/CoreMotion/getting-processed-device-motion-data"
  - "https://developer.apple.com/videos/play/wwdc2021/10287"
---

# Gyroscope and accelerometer

On-device gyroscopes and accelerometers can supply data about a device’s movement in the physical world.



You can use accelerometer and gyroscope data to provide experiences based on real-time, motion-based information in apps and games that run in iOS, iPadOS, and watchOS. tvOS apps can use gyroscope data from the Siri Remote. For developer guidance, see Core Motion.

## Best practices

Use motion data only to offer a tangible benefit to people. For example, a fitness app might use the data to provide feedback about people’s activity and general health, and a game might use the data to enhance gameplay. Avoid gathering data simply to have the data.

Outside of active gameplay, avoid using accelerometers or gyroscopes for the direct manipulation of your interface. Some motion-based gestures may be difficult to replicate precisely, may be physically challenging for some people to perform, and may affect battery usage.

## Platform considerations

No additional considerations for iOS, iPadOS, macOS, tvOS, visionOS, or watchOS.

## Resources

#### Related

Feedback

#### Developer documentation

Getting processed device-motion data — Core Motion

#### Videos
