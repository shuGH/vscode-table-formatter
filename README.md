# VSCode Table Formatter

[![codebeat badge](https://codebeat.co/badges/be046828-b86b-452a-a5fa-aee399b8ddbd)](https://codebeat.co/projects/github-com-shugh-vscode-table-formatter) [![Latest Release](https://vsmarketplacebadge.apphb.com/version-short/shuworks.vscode-table-formatter.svg)](https://marketplace.visualstudio.com/items?itemName=shuworks.vscode-table-formatter) [![Installs](https://vsmarketplacebadge.apphb.com/installs/shuworks.vscode-table-formatter.svg)](https://marketplace.visualstudio.com/items?itemName=shuworks.vscode-table-formatter) [![Rating](https://vsmarketplacebadge.apphb.com/rating-short/shuworks.vscode-table-formatter.svg)](https://marketplace.visualstudio.com/items?itemName=shuworks.vscode-table-formatter#review-details) [![Licence](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/shuGH/vscode-table-formatter/blob/master/LICENSE.md)

Table Formatter is a extention package for the Visual Studio Code to format table syntax.

![demo](https://raw.githubusercontent.com/shuGH/vscode-table-formatter/master/res/complex_demo.gif)

## Description

This extention format table syntax of markup language, aligns the columns width.
Supports multiple markup languages, and you do not need to specify a markup language when formatting.

Features:

* Formatting table syntax
    * Align cell width with pipe
    * Align text position in cell
    * Add missing cells automatically
    * Add missing separator syntax automatically in cell
* Automatic discrimination of table syntax
    * Discriminate markup language automatically
    * Determine range of table syntax automatically
* It is possible to select the format target
    * Only table contain current cursor position
    * All tables in opend text
* CJK support

Supported markup language:

* GitHub Flavored Markdown
    * Header separator
    * Align
* Textile
    * Header
    * Align
* reStructuredText
    * Grid table
    * Simple table

Not supported:

* Spanning rows and colums
* Multiple lines in cell

## Usage

Enter command in the command palette (`Ctrl-Shift-P` or `Cmd-Shift-P`) with cursor position in table syntax.
The current table will be formatted.
Or, you can format all the table syntax in opend text.
At that time, markup language is automatically determined.

Command title:

* `Table: Format Current`
	* format one table syntax contain current cursor position only
	* command: `extension.table.formatCurrent`
* `Table: Format All`
	* format all table syntaxes in opend text
	* command: `extension.table.formatAll`

<!---
* `Table: Format CSV`
* `Table: Insert Blank Row`
* `Table: Insert Blank Column`
* `Table: Insert Escaped Pipe`
* `Table: Insert Escaped Break`
* `Table: Convert to Plain Text Table`
-->

Sample:

* Plain Text Table <a href="#1">*1</a>

    ```
    |English|Hello
    |Chinese|你好|       |Vietnamese|嗔嘲
    |Japanese|こんにちは||Korean|안녕하세요

    //=>
    | English  | Hello      | |            |            |
    | Chinese  | 你好       | | Vietnamese | 嗔嘲       |
    | Japanese | こんにちは | | Korean     | 안녕하세요 |
    ```

* Markdown

    ```
    |-            || update | commit | checkout |
    |-||:-|:-:|-:|
    git||pull / fetch > merge|commit / push|clone
    hg ||pull > update|commit / push|clone

    // =>
    |  -  |     |        update        |    commit     | checkout |
    | --- | --- | :------------------- | :-----------: | -------: |
    | git |     | pull / fetch > merge | commit / push |    clone |
    | hg  |     | pull > update        | commit / push |    clone |
    ```

* Textile

    ```
    _.name|_.age
    |John Doe|>.35  |
    |Jane Doe|<.  19|
    Nanashi Gonbei|=.6

    // =>
    |_.      name      |_. age |
    |   John Doe       |>.  35 |
    |   Jane Doe       |<. 19  |
    |   Nanashi Gonbei |=.  6  |
    ```

* Grid Table

    ```
    +
    ||Mon|Tue|Wed|Thu|Fri|
    +=
    |田中|(^^)|(xx)|(xx)|('')|(^^)|
    -+
    |鈴木|(^^)|(^^)|('')|(xx)|(^^)|
    +

    // =>
    +------+------+------+------+------+------+
    |      | Mon  | Tue  | Wed  | Thu  | Fri  |
    +======+======+======+======+======+======+
    | 田中 | (^^) | (xx) | (xx) | ('') | (^^) |
    +------+------+------+------+------+------+
    | 鈴木 | (^^) | (^^) | ('') | (xx) | (^^) |
    +------+------+------+------+------+------+
    ```

* Simple Table <a href="#2">*2</a>

    ```
    =
    Input . Output
    -
    A B "A or B" A_and_B
    = = = =
    False False False False
    True False True False
    =

    // =>
    =====  =====  ========  =======
    Input    .     Output
    -----  -----  --------  -------
      A      B    "A or B"  A_and_B
    =====  =====  ========  =======
    False  False  False     False
    True   False  True      False
    =====  =====  ========  =======
    ```

## Configration

Some of configrations and examples of it.

* `tableformatter.common.centerAlignedHeader`

    ```
    // true
    | Elem |   Win    | Lose  |
    | ---- | :------- | ----: |
    | Rock | Scissors | Paper |

    // false
    | Elem | Win      |  Lose |
    | ---- | :------- | ----: |
    | Rock | Scissors | Paper |
    ```

* `tableformatter.markdown.oneSpacePadding`

    ```
    // true
    |   Elem   |  Win  | Lose |
    | -------- | :---- | ---: |
    | Scissors | Paper | Rock |

    // false
    |   Elem   |  Win  | Lose |
    |----------|:------|-----:|
    | Scissors | Paper | Rock |
    ```

* `tableformatter.markdown.tableEdgesType`

    * 'Normal': Formatted table has delimiters on both sides.
    * 'Borderless': Formatted table has no delimiters on both sides.
    * 'Auto': If original table has no pipe delimiter at all line heads, format as borderless.

    ```
    // Normal
    | Elem  | Win  |   Lose   |
    | ----- | :--- | :------- |
    | Paper | Rock | Scissors |

    // Borderless
    Elem  | Win  |   Lose
    ----- | :--- | :-------
    Paper | Rock | Scissors
    ```

## Installation

Search extension in marketplace and Install.

1. In the command palette (`Ctrl-Shift-P` or `Cmd-Shift-P`) select Install Extensions.
2. Search for table formatter and select.

## Roadmap

* [x] reStructuredText support
    * [x] Grid table
    * [x] Simple table
* [ ] CSV support
    * [ ] Formatting
* [x] Configuration
    * [ ] Switching Enable Text algin
    * [ ] Escaped pipe string
    * [ ] Escaped break string
* [ ] Simple table editing
	* [ ] Insert blank col and blank row
	* [ ] Insert escaped pipe and break
	* [ ] Convert to plain text table from CSV
* [ ] Fast and simple shortcut format in table syntax
    * e.g.) Press Tab key in table syntax, and format current table
    * Probably needs updating of VSCood features about key bindings "when" property.

## Release Notes

[Changelog](https://github.com/shuGH/vscode-table-formatter/blob/master/CHANGELOG.md)

## Licence

[MIT License](https://github.com/shuGH/vscode-table-formatter/blob/master/LICENSE.md)

## Author

[Shuzo.I](https://github.com/shuGH)

**Enjoy!**

<a name="1"></a>*1 It is misaligned because this monospaced font not compatible with CJK.

<a name="2"></a>*2 Need to specific syntax. One cell content have no space, or put between double quotation.
