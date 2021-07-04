const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const base_dir = "..";

async function main() {
    var app = express();

    app.use(async (req, res, next) => {
        //console.log(req.path);
        if (req.path.endsWith("/")) {
            let url_path = decodeURI(req.path);
            let dir_path = path.resolve(path.join(base_dir, url_path));
            try {
                var dir = await fs.readdir(dir_path);
                res.send(await render_directory(url_path, dir_path, dir));
            } catch (e) {
                console.log(e);
                res.send(render_dir_nonexistant(url_path));
            }
        } else {
            next();
        }
    });

    app.use(express.static(base_dir));
    
    app.listen(80, () => console.log("Running"));    
}

async function render_directory(url_path, dir_path, dir) {
    let parent_dir = path.parse(url_path).dir;
    if (parent_dir != "/")
        parent_dir += "/";
    return `
    <html>
        <head>
            <title>Test</title>
        </head>
        <style>
            table {
                border-collapse: collapse;
                border: 1px solid black;
            }
            td {
                border-top: 1px solid black;
            }
            a {
                display: flex;
                flex-flow: row;
                padding: 10px;
            }
            .sizedisplay-left {
                padding: 10px 4px 10px 10px;
            }
            .sizedisplay-right {
                padding: 10px 10px 10px 0px;
            }
        </style>
        <body>
            <p>
                ${url_path}
            </p>
            ${url_path != "/" ? `<p><input type="button" value="↑ Back Up" onclick="window.location='${parent_dir}'"></p>` : "<p></p>"}
            <table>
                ${
                    (await Promise.all(dir.map(async file => {
                        let fpath = path.join(dir_path, file);
                        let ufpath = path.join(url_path, file);
                        try {
                            var stat = await fs.stat(fpath);
                        } catch(e) {
                            return "";
                        }
                        var name, href, download, size, sizedenom;
                        if (stat.isDirectory()) {
                            name = `${file}/`;
                            href = `href="${ufpath}/"`;
                            download = "";
                            size = "";
                            sizedenom = "";
                        } else {
                            name = file;
                            href = `href="${ufpath}" download`;
                            download = `<a ${href}>download</a>`;
                            [size, sizedenom] = normalize_size(stat.size);
                        }
                        return `
                        <tr>
                            <td><a ${href}>${name}</a></td>
                            <td>${download}</td>
                            <td class="sizedisplay-left">${size}</td>
                            <td class="sizedisplay-right">${sizedenom}</td>
                        </tr>
                        `;
                    }))).join("")
                }
            </table>
            ${url_path != "/" ? `<p><input type="button" value="↑ Back Up" onclick="window.location='${parent_dir}'"></p>` : ""}
        </body>
    </html>
    `;
}

function render_dir_nonexistant(dir_path) {
    return `
    <html>
        <head>
            <title>Test</title>
        </head>
        <body>
            Unable to access ${dir_path}
        </body>
    </html>
    `;
}

function normalize_size(bytes) {
    const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
    for (let i = 0; i < sizes.length; i++) {
        if (bytes < (1024**(i+1)) || i == sizes.length-1) {
            let sizenum = i == 0 ? bytes : (bytes / (1024**i)).toFixed(2);
            return [sizenum, sizes[i]];
        }
    }
}

main();