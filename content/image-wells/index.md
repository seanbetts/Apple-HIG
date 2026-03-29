---
title: "Image wells"
source_url: "https://developer.apple.com/design/human-interface-guidelines/image-wells"
canonical_path: "/image-wells"
description: "An image well is an editable version of an image view."
section: "Human Interface Guidelines"
breadcrumbs:
  - "Human Interface Guidelines"
  - "Image wells"
apple_changes: []
internal_links:
  - "/image-views"
  - "/the-menu-bar"
external_links:
  - "https://developer.apple.com/documentation/AppKit/NSImageView"
---

# Image wells

An image well is an editable version of an image view.



After selecting an image well, people can copy and paste its image or delete it. People can also drag a new image into an image well without selecting it first.

## Best practices

Revert to a default image when necessary. If your image well requires an image, display the default image again if people clear the content of the image well.

If your image well supports copy and paste, make sure the standard copy and paste menu items are available. People generally expect to choose these menu items — or use the standard keyboard shortcuts — to interact with an image well. For guidance, see Edit menu.

For related guidance, see Image views.

## Platform considerations

Not supported in iOS, iPadOS, tvOS, visionOS, or watchOS.

## Resources

#### Related

Image views

#### Developer documentation

NSImageView — AppKit
