/*
 * Created on Sun Aug 07 2016
 *
 * The MIT License (MIT)
 * Copyright (c) 2016 Donna Iwan Setiawan
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
 * TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var vscode = require('vscode');

function insertFileHeaderComment(){
    var workspace = vscode.workspace,
        editor = vscode.window.activeTextEditor,
        root = workspace.rootPath,
        prefix = 'fileHeaderComment',
        lang_id = editor.document.languageId,
        t_default = workspace.getConfiguration(prefix+".template.*"),
        t_lang = workspace.getConfiguration(prefix+".template."+lang_id),
        r_default = workspace.getConfiguration(prefix+".parameter.*"),
        r_lang = workspace.getConfiguration(prefix+".parameter."+lang_id),
        template = [];

    if((t_lang instanceof Array)){
        template = t_lang;
    }else if(t_default instanceof Array){
        template = t_default;
    }else{
        template = [
            "${commentbegin}",
            "${commentprefix} Created on ${date}",
            "${commentprefix}",
            "${commentprefix} Copyright (c) ${year} ${company}",
            "${commentend}"
        ];
    }
    var date = new Date(),
        replace = {
            'date': date.toDateString(),
            'time': date.toLocaleTimeString(),
            'time24h': date.getHours()+':'+date.getMinutes()+':'+date.getSeconds(),
            'year': date.getFullYear(),
            'company': 'Your Company'
        };
    
    replace = Object.assign(replace, {
        'commentbegin': '/*',
        'commentprefix': ' *',
        'commentend': ' */',
        'datetime': replace.date+ " "+replace.time,
        'datetime24h': replace.date+ " "+replace.time24h
    });
    replace.now = replace.datetime;
    replace.now24h = replace.datetime24h;
    replace = Object.assign(replace, r_default);
    
    switch(lang_id){
        case "swift":
            replace.commentbegin = "/**";
            break;
        case "lua":
            replace = Object.assign(replace, {
                'commentbegin': "--[[",
                'commentprefix': "--",
                'commentend': "--]]"
            });
            break;
        case "perl":
        case "ruby":
            replace = Object.assign(replace, {
                'commentbegin': "#",
                'commentprefix': "#",
                'commentend': "#"
            });
            break;
        case "vb":
            replace = Object.assign(replace, {
                'commentbegin': "'",
                'commentprefix': "'",
                'commentend': "'"
            });
            break;
        case 'clojure':
            replace = Object.assign(replace, {
                'commentbegin': ";;",
                'commentprefix': ";",
                'commentend': ";;"
            });
            break;
        case 'python':
            replace = Object.assign(replace, {
                'commentbegin': "'''",
                'commentprefix': "\b",
                'commentend': "'''"
            });
            break;
        case "xml":
        case "html":
            replace = Object.assign(replace, {
                'commentbegin': "<!--",
                'commentprefix': "\b",
                'commentend': "-->"
            });
            break;
    }
    replace = Object.assign(replace, r_lang);

    if(!editor)
        return;
    replace = JSON.parse(JSON.stringify(replace));
    var s_template = template.join("\n"),
        escape = function(string) {
            return string.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
        };
    for(var r in replace){
        var regexp = new RegExp(escape("${"+r+"}"), "gi"),
            replace_with = replace[r];
        if(replace_with.join){
            replace_with = replace_with.join("\n"+ replace.commentprefix);
        }else if(replace_with.replace){
            replace_with = replace_with.replace("\n", "\n"+ replace.commentprefix);
        }

        s_template = s_template.replace(regexp, replace_with);
    }

    //parse on more time
    //sometimes parameter has parameter inside it
    for(var r in replace){
        var regexp = new RegExp(escape("${"+r+"}"), "gi"),
            replace_with = replace[r];
        s_template = s_template.replace(regexp, replace_with);
    }

    //insert header comment at cursor
    editor.edit(function(edit){
        edit.insert(editor.selection.active, s_template+"\n");
    });
}
exports.insertFileHeaderComment = insertFileHeaderComment;