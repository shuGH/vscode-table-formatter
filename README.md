# VSCode Table Formatter

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
* Textile

Planned to support:

* reStructuredText
* CSV
	* Perhaps it will be specific command

Not supported:

* Spanning rows and colums
* Multiple lines in cell

## Usage

Enter command in the command palette (`Ctrl-Shift-P` or `Cmd-Shift-P`) with cursor position in table syntax. 
The current table will be formatted. 
Or, you can format all the table syntax in opend text.  
At that time, markup language is automatically determined. 
More precisely, determined for each cell. So it works even if markup language is mixed.

Command title:

* Table: Format Current
	* format one table syntax contain current cursor position only
	* command: extension.table.formatCurrent
* Table: Format All
	* format all table syntaxes in opend text
	* command: extension.table.formatAll

Sample:

```
// simple
|あいう|a
   bc |えお|   
 |  d안녕하세요ef |g你好   ||h 

//=>
| あいう        | a     | |   |
| bc            | えお  | |   |
| d안녕하세요ef | g你好 | | h |
```

```
// markdown
| Left-aligned | Center-aligned|Right-aligned |
| :-|:---:|     ---:||-
| git status   | git status     | git status
| git diff | git diff | git diff  |

// =>
| Left-aligned | Center-aligned | Right-aligned |     |     |
| :----------- | :------------: | ------------: | --- | --- |
| git status   |   git status   |    git status |     |     |
| git diff     |    git diff    |      git diff |     |     |
```

```
// textile
|_. name|_. age|
|John Doe|5|
|Nanashi Gonbei|=.16|
|>.Right|<.Left-aligned|

// =>
|_. name           |_. age          |
|   John Doe       |   5            |
|   Nanashi Gonbei |=.      16      |
|>.          Right |<. Left-aligned |
```

## Installation

Search extension in marketplace and Install.

1. In the command palette (`Ctrl-Shift-P` or `Cmd-Shift-P`) select Install Extensions.
2. Search for table formatter and select.

## Roadmap

1. reStructuredText support
2. CSV support
3. Simple table editing
	* Insert blank col and blank row
	* Convert to text table from CSV
4. Fast and simple shortcut format in table syntax
	* e.g.) Press Tab key in table syntax, and format current table
	* Probably needs updating of VSCood about key bindings "when" property.
5. Configuration

## Release Notes

### 1.0.0

* 1st release.

## Licence

[MIT](https://github.com/tcnksm/tool/blob/master/LICENCE)

## Author

[shuzo.i](https://github.com/shuGH)

**Enjoy!**
