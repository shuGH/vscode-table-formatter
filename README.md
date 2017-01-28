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

* Plain text table [*1](#1)

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
    | -   |     | update               |    commit     | checkout |
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
    |_. name           |_. age |
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

<!---
* Simple Table [*2](#2)

    ```
    Input . Output
    -
    A B "A or B" A_and_B
    = = = =
    False False False False
    True False True False
    =

    // =>
    Input  .      Output
    -----  -----  --------  -------
    A      B      "A or B"  A_and_B
    =====  =====  ========  =======
    False  False  False     False
    True   False  True      False
    =====  =====  ========  =======
    ```
-->

## Installation

Search extension in marketplace and Install.

1. In the command palette (`Ctrl-Shift-P` or `Cmd-Shift-P`) select Install Extensions.
2. Search for table formatter and select.

## Roadmap

* [ ] reStructuredText support
    * [x] Grid table
    * [ ] Simple table
        * Perhaps need to specific syntax (e.g. No space, interpose with double quotation）
* [ ] CSV support
    * [ ] Formatting
        * Perhaps it will be specific command
    * [ ] Escaping double quotation
* [ ] Simple table editing
	* [ ] Insert blank col and blank row
	* [ ] Insert escaped pipe and break
	* [ ] Convert to plain text table from CSV
* [ ] Configuration
    * [ ] Switching Enable Text algin
    * [ ] Escaped pipe string
    * [ ] Escaped break string
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

<a name="1"></a>
*1 It is misaligned because this monospaced font not compatible with CJK.
