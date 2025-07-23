1.  npm init -y

2.  npm i -D nodemon & chnages in package.json

Github
3.  git commit -m "add initial files for backend"
    git branch -M main
    git remote add origin https://github.com/coolprasad15/v_upload_backend.git
    git push -u origin main

4.  git commit -m "setup project files - Part 1"

5.  Create folders/files
    public/temp
    src/
        app.js
        constants.js
        index.js
        controllers
        db
        middlewares
        models
        routes
        utils

6.  npm i -D prettier
    Add files
        .prettierrc
            {
                "singleQuote": false,
                "bracketSpacing": true,
                "tabWidth": 2,
                "trailingComma": "es5",
                "semi": true
            }

        .prettierignore
            /.vscode
            /node_modules
            ./dist

            *.env
            .env
            .env.*
7.  git commit -m "setup prettier - Part 2"

