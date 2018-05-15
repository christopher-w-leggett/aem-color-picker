# AEM Color Picker
The AEM Color Picker project provides the ability for authors to color and highlight textual content within the AEM 
rich text editor.  This functionality is exposed through a new `colors` RTE plugin that consists of a `text-color` 
feature for coloring text and a `text-highlight` feature for highlighting text.

## Support

| AEM Version | Color Picker Version |
| --- | --- |
| 6.4 | v1.0.0-SNAPSHOT |
| 6.3 | v1.0.0-SNAPSHOT |

## Colors Rich Text Plugin
The `colors` RTE plugin allows authors to apply coloring and highlighting to rich text content as needed.
This plugin uses the `Coral.ColorInput` form field to facilitate the selection of a color and all configuration options 
for this form field are available for customization.

### Features

#### Text Color
The `text-color` feature provides the ability to apply a color to selected text.

#### Text Highlight
The `text-highlight` feature provides the ability to highlight text with a specific color.

### Configuration
The following steps are provided for a starting point and outline all configuration options available.

1. Add the colors plugin to the appropriate RTE configuration.
    ```
    rtePlugins
     +-- ...
     +-- {nt:unstructured} colors
     |    +-- {String[]} features="[text-color,text-highlight]"
     |    +-- {nt:unstructured} text-color
     |    |    +-- {String} autogeneratecolors="off"
     |    |    +-- {String[]} colors="[]"
     |    |    +-- {String} placeholder=""
     |    |    +-- {String} showdefaultcolors="on"
     |    |    +-- {String} showproperties="on"
     |    |    +-- {String} showswatches="on"
     |    |    +-- {String} variant="default"
     |    |    +-- {nt:unstructured} tooltip
     |    |    |    +-- {String} title="Text Color"
     |    |    |    +-- {String} text="Text Color"
     |    +-- {nt:unstructured} text-highlight
     |    |    +-- {String} autogeneratecolors="off"
     |    |    +-- {String[]} colors="[]"
     |    |    +-- {String} placeholder=""
     |    |    +-- {String} showdefaultcolors="on"
     |    |    +-- {String} showproperties="on"
     |    |    +-- {String} showswatches="on"
     |    |    +-- {String} variant="default"
     |    |    +-- {nt:unstructured} tooltip
     |    |    |    +-- {String} title="Text Highlight"
     |    |    |    +-- {String} text="Text Highlight"
     +-- ...
    ```
1. Set appropriate UI settings so plugin icons display.
    ```
    uiSettings
     +-- {nt:unstructured} cui
     |    +-- ...
     |    +-- {nt:unstructured} inline
     |    |    +-- {String[]} toolbar="[...,#format,...]"
     |    |    +-- {nt:unstructured} popovers
     |    |    |    +-- ...
     |    |    |    +-- {nt:unstructured} format
     |    |    |    |    +-- {String[]} items="[...,colors#text-color,colors#text-highlight,...]"
     |    |    |    |    +-- {String} ref="format"
     |    |    |    +-- ...
     |    +-- {nt:unstructured} dialogFullScreen
     |    |    +-- {String[]} toolbar="[...,colors#text-color,colors#text-highlight,...]"
     |    |    +-- ...
     |    +-- {nt:unstructured} fullscreen
     |    |    +-- {String[]} toolbar="[...,colors#text-color,colors#text-highlight,...]"
     |    |    +-- ...
     |    +-- ...
    ```
1. Modify AEM AntiSamy policy to allow the `mark` tag.  This is only required if using the `text-highlight` feature 
and rich text content is output via HTL using the html Display Context (e.g. `${content @ context='html'}`).