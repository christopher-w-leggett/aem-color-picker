# AEM RTE Enhancements
The AEM RTE Enhancements project aims to provide additional features to the AEM rich text field.

## Support

| AEM Version | RTE Enhancements Version |
| --- | --- |
| 6.4 | v1.0.0-SNAPSHOT |
| 6.3 | v1.0.0-SNAPSHOT |

## Colors Plugin
The `colors` plugin allows authors to apply coloring and highlighting to rich text content as needed.
This plugin uses the `Coral.ColorInput` form field to facilitate the selection of a color and all configuration options 
for this form field are available for customization.

### Features

#### Text Color
The `text-color` feature provides the ability to apply a color to selected text.

#### Text Highlight
The `text-highlight` feature provides the ability to highlight text with a specific color.

### Configuration
The following steps are provided for a starting point and outline all configuration options available.

1. Add the `colors` plugin to the appropriate RTE configuration.
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

## Auto Format Plugin
The `auto` plugin provides authors a way to format rich text content quickly by typing character patterns.

### Features

#### Inline Formatting
The `inline` feature provides automatic inline formatting options.  The default configuration allows authors to apply
bold, italic, code and strikethrough formatting.  Additional inline formatting may be configured.

| Pattern | Formatting |
| --- | --- |
| `**text**` or `__text__` | bold |
| `*text*` or `_text_` | italic |
| ``` `text` ``` | code |
| `~~text~~` | strikethrough |

#### Block Formatting
The `block` feature provides automatic block formatting options.  The default configuration allows authors create
unordered lists, ordered lists, headings level 1 through 6, blockquote and preformatted text.

| Pattern | Formatting |
| --- | --- |
| Start a line with `*` or `-` followed by a space | unordered list |
| Start a line with `1.` or `1)` followed by a space | ordered list |
| Start a line with `#` followed by a space | heading 1 |
| Start a line with `##` followed by a space | heading 2 |
| Start a line with `###` followed by a space | heading 3 |
| Start a line with `####` followed by a space | heading 4 |
| Start a line with `#####` followed by a space | heading 5 |
| Start a line with `######` followed by a space | heading 6 |
| Start a line with `>` followed by a space | blockquote |
| Start a line with `_` followed by a space | pre |

### Configuration
The following example is provided to outline all configuration options available.

    ```
    rtePlugins
     +-- ...
     +-- {nt:unstructured} auto
     |    +-- {String[]} features="[inline,block]"
     |    +-- {nt:unstructured} inline
     |    |    +-- {nt:unstructured} inlineElementMapping
     |    |    |    +-- {nt:unstructured} bold
     |    |    |    |    +-- {String[]} charPattern="[**,__]"
     |    |    |    |    +-- {String} tagName="b"
     |    |    |    |    +-- {Boolean} disabled="false"
     |    |    |    +-- {nt:unstructured} italic
     |    |    |    |    +-- {String[]} charPattern="[*,_]"
     |    |    |    |    +-- {String} tagName="i"
     |    |    |    |    +-- {Boolean} disabled="false"
     |    |    |    +-- {nt:unstructured} code
     |    |    |    |    +-- {String[]} charPattern="[`]"
     |    |    |    |    +-- {String} tagName="code"
     |    |    |    |    +-- {Boolean} disabled="false"
     |    +-- {nt:unstructured} block
     |    |    +-- {nt:unstructured} blockElementMapping
     |    |    |    +-- {nt:unstructured} unorderedList
     |    |    |    |    +-- {String[]} charPattern="[*,-]"
     |    |    |    |    +-- {String[]} nodeTree="[ul,li]"
     |    |    |    |    +-- {Boolean} disabled="false"
     |    |    |    +-- {nt:unstructured} orderedList
     |    |    |    |    +-- {String[]} charPattern="[1.,1)]"
     |    |    |    |    +-- {String[]} nodeTree="[ol,li]"
     |    |    |    |    +-- {Boolean} disabled="false"
     |    |    |    +-- {nt:unstructured} h1
     |    |    |    |    +-- {String[]} charPattern="[#]"
     |    |    |    |    +-- {String[]} nodeTree="[h1]"
     |    |    |    |    +-- {Boolean} disabled="false"
     |    |    |    +-- {nt:unstructured} h2
     |    |    |    |    +-- {String[]} charPattern="[##]"
     |    |    |    |    +-- {String[]} nodeTree="[h2]"
     |    |    |    |    +-- {Boolean} disabled="false"
     |    |    |    +-- {nt:unstructured} h3
     |    |    |    |    +-- {String[]} charPattern="[###]"
     |    |    |    |    +-- {String[]} nodeTree="[h3]"
     |    |    |    |    +-- {Boolean} disabled="false"
     |    |    |    +-- {nt:unstructured} h4
     |    |    |    |    +-- {String[]} charPattern="[####]"
     |    |    |    |    +-- {String[]} nodeTree="[h4]"
     |    |    |    |    +-- {Boolean} disabled="false"
     |    |    |    +-- {nt:unstructured} h5
     |    |    |    |    +-- {String[]} charPattern="[#####]"
     |    |    |    |    +-- {String[]} nodeTree="[h5]"
     |    |    |    |    +-- {Boolean} disabled="false"
     |    |    |    +-- {nt:unstructured} h6
     |    |    |    |    +-- {String[]} charPattern="[######]"
     |    |    |    |    +-- {String[]} nodeTree="[h6]"
     |    |    |    |    +-- {Boolean} disabled="false"
     |    |    |    +-- {nt:unstructured} blockquote
     |    |    |    |    +-- {String[]} charPattern="[>]"
     |    |    |    |    +-- {String[]} nodeTree="[blockquote]"
     |    |    |    |    +-- {Boolean} disabled="false"
     |    |    |    +-- {nt:unstructured} pre
     |    |    |    |    +-- {String[]} charPattern="[_]"
     |    |    |    |    +-- {String[]} nodeTree="[pre]"
     |    |    |    |    +-- {Boolean} disabled="false"
     +-- ...
    ```

## Format Extension Plugin
The `format-ext` plugin provides a configurable way to add additional formats to the rich text editors toolbar.  This
may be useful if you want a toolbar option for managing inline formats added via the `auto` plugin or if you want to
provide the additional inline formats from the `auto` plugin without automatic inline formatting.

### Features

#### Format Extension
The `format-ext` feature provides the ability to configure the additional inline formats in the toolbar.

### Configuration
The following steps are provided for a starting point and outline all configuration options available.

1. Add the `format-ext` plugin to the appropriate RTE configuration.
    ```
    rtePlugins
     +-- ...
     +-- {nt:unstructured} format-ext
     |    +-- {String[]} features="[format-ext]"
     |    +-- {nt:unstructured} format-ext
     |    |    +-- {nt:unstructured} code
     |    |    |    +-- {String} tagName="code"
     |    |    |    +-- {Boolean} disabled="false"
     |    |    |    +-- {nt:unstructured} tooltip
     |    |    |    |    +-- {String} title="Code"
     |    |    |    |    +-- {String} text="Code"
     |    |    +-- {nt:unstructured} strikethrough
     |    |    |    +-- {String} tagName="s"
     |    |    |    +-- {Boolean} disabled="false"
     |    |    |    +-- {nt:unstructured} tooltip
     |    |    |    |    +-- {String} title="Strikethrough"
     |    |    |    |    +-- {String} text="Strikethrough"
     +-- ...
    ```
1. Set appropriate UI settings so additional format icons display.  The command reference follows the format
`format-ext#<format-name>`.
    ```
    uiSettings
     +-- {nt:unstructured} cui
     |    +-- ...
     |    +-- {nt:unstructured} inline
     |    |    +-- {String[]} toolbar="[...,#format,...]"
     |    |    +-- {nt:unstructured} popovers
     |    |    |    +-- ...
     |    |    |    +-- {nt:unstructured} format
     |    |    |    |    +-- {String[]} items="[...,format-ext#code,format-ext#strikethrough,...]"
     |    |    |    |    +-- {String} ref="format"
     |    |    |    +-- ...
     |    +-- {nt:unstructured} dialogFullScreen
     |    |    +-- {String[]} toolbar="[...,format-ext#code,format-ext#strikethrough,...]"
     |    |    +-- ...
     |    +-- {nt:unstructured} fullscreen
     |    |    +-- {String[]} toolbar="[...,format-ext#code,format-ext#strikethrough,...]"
     |    |    +-- ...
     |    +-- ...
     |    +-- {nt:unstructured} icons
     |    |    +-- {nt:unstructured} code
     |    |    |    +-- {String} command="format-ext#code"
     |    |    |    +-- {String} icon="code"
     |    |    +-- {nt:unstructured} strikethrough
     |    |    |    +-- {String} command="format-ext#strikethrough"
     |    |    |    +-- {String} icon="textStrikethrough"
    ```


## Enforcer Plugin
The `enforcer` plugin provides a way to restrict what markup is allowed within the RTE.  This plugins default
configuration supports all markup rendered from the out of the box AEM plugins as well as plugins within
this library.  If any custom plugins or additional markup is required, the `enforcer` plugins configuration may be
modified to support these requirements.

### Features

#### Markup
The `markup` feature will restrict what markup is allowed within the RTE.  This can be useful if the AEM 
`misctools#sourceedit` feature would like to be used while still restricting what markup may be placed in the RTE.

### Configuration

#### Rules
1. If a tag/style/attribute is not specifically allowed, it will be denied.
1. Tag policies are defined under a `tagPolicies` node.  If a tag policy contains a `stylePolicies` or
   `attributePolicies` configuration, these policies will be used in place of the global style and attribute policies.
1. Global style policies are defined under a `stylePolicies` node.
1. Global attribute policies are defined under an `attributePolicies` node.
1. A wildcard of `+` may be used as the name for any policy.  Only 1 is allowed per policy group and
   would mostly be used to reverse the whitelist to a blacklist.  A wildcard policy within the
   tagPolicies group may not contain any child policies (`stylePolicies`, `attributePolicies`).
1. A missing or empty `values` array within a style or attribute policy will indicate that all values are
   allowed or denied depending on the `policy` property.
1. A `policy` property must be defined and contain a value of either `allow` or `deny`.

#### Format
```
{
    'tagPolicies': {
        '<tag> | +': {
            'policy': 'allow | deny',
            'stylePolicies': {
                ...
            },
            'attributePolicies': {
                ...
            }
        }
    },
    'stylePolicies': {
        '<style>': {
            'policy': 'allow | deny',
            'values': ['<value>',...]
        }
    },
    'attributePolicies': {
        '<attribute>': {
            'policy': 'allow | deny',
            'split': '<split-string>',
            'values': ['<value>',...]
        }
    }
}
```

#### Example
The following configuration enables and modifies the `enforcer#markup` configuration so that `div` tags are not allowed.

```
rtePlugins
 +-- ...
 +-- {nt:unstructured} enforcer
 |    +-- {String[]} features="[markup]"
 |    +-- {nt:unstructured} markup
 |    |    +-- {nt:unstructured} tagPolicies
 |    |    |    +-- {nt:unstructured} div
 |    |    |    |    +-- {String} policy="deny"
 +-- ...
```