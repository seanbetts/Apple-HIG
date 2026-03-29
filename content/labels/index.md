---
title: "Labels"
source_url: "https://developer.apple.com/design/human-interface-guidelines/labels"
canonical_path: "/labels"
description: "A label is a static piece of text that people can read and often copy, but not edit."
section: "Human Interface Guidelines"
breadcrumbs:
  - "Human Interface Guidelines"
  - "Labels"
apple_changes:
  - label: "Updated"
    raw: "Updated guidance to reflect changes in watchOS 10."
internal_links:
  - "/buttons"
  - "/color"
  - "/components/system-experiences/complications"
  - "/lists-and-tables"
  - "/menus"
  - "/text-fields"
  - "/text-views"
external_links:
  - "https://developer.apple.com/documentation/AppKit/NSColor/labelColor"
  - "https://developer.apple.com/documentation/AppKit/NSColor/quaternaryLabelColor"
  - "https://developer.apple.com/documentation/AppKit/NSColor/secondaryLabelColor"
  - "https://developer.apple.com/documentation/AppKit/NSColor/tertiaryLabelColor"
  - "https://developer.apple.com/documentation/AppKit/NSTextField"
  - "https://developer.apple.com/documentation/AppKit/NSTextField/isEditable"
  - "https://developer.apple.com/documentation/SwiftUI/Label"
  - "https://developer.apple.com/documentation/SwiftUI/Text"
  - "https://developer.apple.com/documentation/UIKit/UIColor/label"
  - "https://developer.apple.com/documentation/UIKit/UIColor/quaternaryLabel"
  - "https://developer.apple.com/documentation/UIKit/UIColor/secondaryLabel"
  - "https://developer.apple.com/documentation/UIKit/UIColor/tertiaryLabel"
  - "https://developer.apple.com/documentation/UIKit/UILabel"
---

# Labels

A label is a static piece of text that people can read and often copy, but not edit.



Labels display text throughout the interface, in buttons, menu items, and views, helping people understand the current context and what they can do next.

The term label refers to uneditable text that can appear in various places. For example:

- Within a button, a label generally conveys what the button does, such as Edit, Cancel, or Send.
- Within many lists, a label can describe each item, often accompanied by a symbol or an image.
- Within a view, a label might provide additional context by introducing a control or describing a common action or task that people can perform in the view.

The guidance below can help you use a label to display text. In some cases, guidance for specific components — such as action buttons, menus, and lists and tables — includes additional recommendations for using text.

## Best practices

Use a label to display a small amount of text that people don’t need to edit. If you need to let people edit a small amount of text, use a text field. If you need to display a large amount of text, and optionally let people edit it, use a text view.

Prefer system fonts. A label can display plain or styled text, and it supports Dynamic Type (where available) by default. If you adjust the style of a label or use custom fonts, make sure the text remains legible.

Use system-provided label colors to communicate relative importance. The system defines four label colors that vary in appearance to help you give text different levels of visual importance. For additional guidance, see Color.

Make useful label text selectable. If a label contains useful information — like an error message, a location, or an IP address — consider letting people select and copy it for pasting elsewhere.

## Platform considerations

No additional considerations for iOS, iPadOS, tvOS, or visionOS.

### macOS

### watchOS

Date and time text components (shown below on the left) display the current date, the current time, or a combination of both. You can configure a date text component to use a variety of formats, calendars, and time zones. A countdown timer text component (shown below on the right) displays a precise countdown or count-up timer. You can configure a timer text component to display its count value in a variety of formats.

When you use the system-provided date and timer text components, watchOS automatically adjusts the label’s presentation to fit the available space. The system also updates the content without further input from your app.

Consider using date and timer components in complications. For design guidance, see Complications; for developer guidance, see Text.

## Resources

#### Related

Text fields

Text views

#### Developer documentation

Label — SwiftUI

Text — SwiftUI

UILabel — UIKit

NSTextField — AppKit

## Change log
