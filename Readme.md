1.  npm init -y

2.  npm i -D nodemon (chnages in package.json)

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

8.  Database MongoDB Cluster Setup
        Add new DB and step follow
        Name database
        Database access & Network access
        Database/Cluster for connect with compass and all

9.  .env file
    PORT and Mongodb
        PORT=8000
        MONGODB_URL=mongodb+srv://prasadguhagarkar15:prasad15@cluster0.gtjmpld.mongodb.net (prasad15 is a password)

10. Connect DB with trycatch condition

11. user & video model files

12. install mongoose-aggregate-paginate-v2, jwttoken & bcrypt pass

13. access & refresh token key (.env)

14. install multer & cloudinary

15. multer.middleware.js & cludinary.js

16. user.controller.js & user.route.js

17. // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload then to clodinary avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user create
    // return res

18. follow the steps

19. 


https://console.cloudinary.com/app/c-31db4d351e2a63675f226724482ec8/settings/api-keys
https://cloud.mongodb.com/v2/6880a3934e790c520ec04c66#/overview
https://github.com/coolprasad15/v_upload_backend
https://github.com/hiteshchoudhary/chai-backend/blob/main/src/index.js