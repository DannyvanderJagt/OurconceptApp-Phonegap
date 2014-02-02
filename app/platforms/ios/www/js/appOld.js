/** 
* Promise function for preventing spaghetti code.
* @method DataHandler.Promise
* @return {Object} It will return a object with the functions success and error. You can access the function with [name](params); if the param is a function you overwrite the existing function, if the params are no function then you call the [name] function of the returned object. 
*/ 
var Promise = function(){
    this.called = {};
};
Promise.prototype = {
    success:function(callback){
        if(typeof callback === 'function'){
             this.success = callback;
            if(this.called['success']){
                 this.success.apply(null, this.called['success']);   
            }
        }else{
            console.log('args', arguments);
            this.called['success'] = arguments;
        }
        return this;
    },
    error: function(callback){ 
        if(typeof callback === 'function'){
             this.error = callback;
            if(this.called['error']){
                 this.error.apply(null, this.called['error']);   
            }
        }else{
            console.log('args', arguments);
            this.called['error'] = arguments;
        }
        return this;
    }
};

// Clone a object instead of copy it.
//http://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object 
var CloneObject = function(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            copy[attr] = clone(obj[attr]);
          //  if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

/*********************************************************
                         App Core
**********************************************************/
var App = {
    initialize: function(sender){ // Input/outpur sender!
        // Initialize the app!.
       // App.Connection.initialize(); // No waiting required.
        // Start listening for message for the AppBridge module.
       // App.Bridge.listen(); // No waiting required.
        // Fire up the database.
        App.Data.initialize()
        .success(function(){
           console.log('App is in sync!',sender);
           if(sender){ sender.success(); };
        })
        .error(function(){
            // TODO: Something went wrong!
            if(sender){ sender.error(); };
        });
    }
}; // Store the hole app core.
// Static.
App.Static = {
    url: "http://ourconcepts.serverict.nl/",
    db: null, 
    settings: {
        db:{
            name: "Database",
            version: "1.0",
            displayName: "Cordova Demo",
            size:  5 * 1024 * 1024, // 5MB
            table:{
                static:{
                    type: "type unique",
                    data: "data",
                },
                pages:{
                    id: "id unique",
                    title: "title",
                    data: "data",
                    childOfId: "childOf", // The id of the parent page.
                    childOfName: "childOfName", // The name of the parent page.
                },
                posts:{
                    id: "id unique",
                    title: "title",
                    data: "data",
                },
            },
        },
    },
    api: {
        menu: {
            db: 'static',
            params:{
                type: 'menu'
            },
            url: '?json=get_menu_structure&callback=?',
        },
        page: {
            db: 'pages',
            params: {
            },
            url: "?json=get_page&id={{page.object_id}}&callback=?"
          //  url: "get_page/?id={{page.object_id}}&callback=?" // See App.Server.pages
        },
        post: {
            db: "posts",
            params:{
            },
            url: "?json=get_posts&callback=?",
            //url: "http://dannyvanderjagt.nl/ourconcept/api/get_posts/?callback=?",
        }
    },
    view: {
        "noConnection"  :   "views/defaults/noConnection.view.html",
        "index"         :   "views/index.view.html",
        "page"          :   "views/page.view.html",
        "menu"          :   "views/menu.view.html",
        "news"          :   "views/news.view.html",
    },
    postPage:"Nieuws", // The title of the page with the newsposts.
    pages:[], // Filled automaticaly.
};

// Hanles the local data / database.
App.Data = {
    initializePromise: null,
    initialize: function(){
        App.Data.initializePromise = new Promise();
        App.Data.createDatabase();
        return App.Data.initializePromise;
    },
    // Create the database.
    createDatabase: function(){
        var database = App.Static.db = window.openDatabase(
            App.Static.settings.db.name,
            App.Static.settings.db.version, 
            App.Static.settings.db.displayName,
            App.Static.settings.db.size);
        
        // Transaction.
        App.Static.db.transaction(App.Data.databaseCreateTransaction, 
              // Error.
              function(){
                  console.log('couldnt create the database!', arguments);
                  App.Data.initializePromise.error("Couldn't create the databse!");
              }, 
              // Success.                    
              function(){
                  // Database created!
              });
    },
    databaseCreateTransaction: function(tx){
        // Try to create the tables if they doesn't exist.
        var p = App.Data.createTables(tx)
        .success(function(){
            // Tables are created.
            // Check for emptyness.
            var empty = App.Data.checkEmpty(tx)
            .success(function(){
                // Can we sync the database?
                console.log('s');
                if(App.Connection.online()){
                    // Yes we can! 
                    // TODO: Sync.
                    console.log('TODO: sync');
                    // Done.
                    App.Data.initializePromise.success();
                }else{
                    // No we can't.
                    // TODO: What to do?
                    console.log('TODO: show no-connection view');
                }
            })
            .error(function(emptyTables){
                console.log(emptyTables, 'are empty tables!');
                // Sync the database.
                // Check for internet connection.
                if(App.Connection.online()){
                    // There is internet so sync the database.
                    App.Data.sync(emptyTables)
                    .success(function(){
                        console.log('Database is synced!');
                        App.Data.initializePromise.success();
                    })
                    .error(function(){
                        console.error('Couldnt sync the database!', arguments);
                    });
                }else{
                    // There is no internet connection.
                    // TODO: Show no internet view!.
                    console.log('TODO: show no-connection view');
                }
            });

        })
        .error(function(){
            console.log('tables not created');
            App.Data.initializePromise.error("Couldn't create the tables!");
        });
    },
    // Create the tables.
    createTables: function(tx){
        var p = new Promise(),
            total = 0,
            tried = 0,
            created = 0;
        
        // Count the total number of 
        for(var tcount in App.Static.settings.db.table){
            total++;
        };
        
        // Loop throught the tables and create them.
        for(var t in App.Static.settings.db.table){
            
            // Create queue.
            var queue = [];
            for(var q in App.Static.settings.db.table[t]){
                queue.push(App.Static.settings.db.table[t][q]);
            }
            
            // Execute the query.
           tx.executeSql('DROP TABLE IF EXISTS '+t);
            tx.executeSql('CREATE TABLE IF NOT EXISTS '+t+' ('+queue.join()+')', function(){
                 // Error.
                console.log('Error creating table');
                tried++;
                checkReturn();
            },function(err,err2){
                tried++;
                created++;
                checkReturn();
            });
        }
        
        // Check if we can activate a success or error callback.
        function checkReturn(){
            if(total === tried){
                // Check if the right amount of tables are created!
                if(created === total){
                    p.success();
                }else{
                    p.error();   
                }
            }
        }
        
        // Return the promise.
        return p;
    },
    // Check if one or multiple tables are empty.
    checkEmpty: function(tx){
        var p = new Promise(),
            total = 0,
            tried = 0,
            emptyTables = [],
            tableNames = [];
        
        // Count the total number of 
        for(var tcount in App.Static.settings.db.table){
            total++;
            tableNames.push(tcount);
        };
        
        for(var t in App.Static.settings.db.table){
            tx.executeSql("SELECT * FROM static", function(){
                 // Error.
                console.log('Couldnt check the table for emptyness.');
                tried++;
                checkReturn();
            },function(transaction, result){
                tried++;
                if(result.rows.length <= 0){
                    emptyTables.push(tableNames[tried-1]);
                }
                checkReturn();
            });
        }
        
        function checkReturn(){
            if(total === tried){
                if(emptyTables.length === 0){
                    p.success();   
                }else{
                    p.error(emptyTables);   
                }  
            }
        }
        
        
        return p;
    },
    // Set and get.
    // Save some data to the database. (api only!);
    set: function(apiName, data){
        var p = new Promise(),
            query = App.Data.prepareInsertQuery(apiName, data);
        
        App.Data.executeQuery(query)
        .success(function(data){
            console.log('set success');
            p.success();
        })
        .error(function(){
            console.log('set error');
            p.error();
        });

        
        return p;
    },
    // Return [].
    getApisByTable: function(table){
        // Loop through the apis.
        var founded = [];
        for(var api in App.Static.api){
             
            if(App.Static.api[api].db === table){
                founded.push(api);
                console.log('db found', App.Static.api[api].db); 
            }
        }
        return founded;
    },
    // --------------------- Sync Area. --------------------- //
    // sync the app.
    sync: function(){
        var p = new Promise();
        // Check for internet connection.
        if(App.Connection.online()){
            // Get the data from the server.
            // Order of sync: menu -> pages -> others.
            // Sync the menu.
            console.log('try to sync the menu');
            App.Data.syncMenu()
            .success(function(){
                // Menu is sync and saved.
                // Sync the pages.
                console.log('menu is synced');
                App.Data.syncPages()
                .success(function(){
                    // Menu is sync and saved.
                    // Sync the pages.
                    console.log('Pages synced!');
                    p.success();
                })
                .error(function(){
                    // Something went wrong.
                    console.log('menu sync error');
                    p.error();
                });
            })
            .error(function(){
                // Something went wrong.
                console.log('menu not synced');
                p.error();
            });
            
        }else{
            console.log('not online');
            p.error();   
        }
        // Return the promise.
        return p;
    },
    // Get the data from the server and push it into the local database.
    syncTable: function(table){
        var p = new Promise(),
            apis = App.Data.getApisByTable(table);
        // Sync apis.
        if(apis.length > 0){
            // Get the data from the api.
            for(var api in apis){
               App.Data.syncApi(apis[api]); 
            };
        }else{
            // Apis founded with the requested table.
            p.error();
        }
        
        return p;
    },
    checkMetaDataForApp: function(page){
         if(page.meta && page.meta.app && page.meta.app == "true"){
            
                    return true;
              
        }
        return false;
    },
    syncMenu: function(){
        var p = new Promise();
        // Check if the api exists.
        console.log('menu sync!!!!!');
        if(App.Static.api.menu){
            // Sync the api.
            var api = App.Static.api.menu;
      
            console.log('get menu data');
            //App.Server.get(api.url)
            $.getJSON("http://ourconcepts.serverict.nl/?json=get_menu_structure&callback=?")
            .success(function(data){
              
                console.log('data', data, data.pages);
                // Save to the local database.
                // Filter the data.
                window.menuData = data;
                //console.log("DATA OLD" , data);
                var pagesNew = [];
                for(var i = 0, len = data.pages.length; i < len; i++){
                 
                    if(App.Data.checkMetaDataForApp(data.pages[i])){
                           console.log('page'+i, data.pages[i]);
                        // Check for children.
                        var tempPage = [];
                        tempPage.push(data.pages[i]);
                        
                        
                        // Check for newspage.
                        //console.log(data.pages[i].meta && data.pages[i].meta.nieuws);
                        if(data.pages[i].meta && data.pages[i].meta.app && data.pages[i].meta.nieuws == "true"){
                            // Newspage founded.
                            App.Static.postPage = data.pages[i].title;
                        };
                     
                        if(data.pages[i].children){
                            var children = [];
                            for(var ic = 0, lenc = data.pages[i].children.length; ic < lenc; ic++){
                                // Check for meta data.
                                if(App.Data.checkMetaDataForApp(data.pages[i].children[0])){
                                     children.push(data.pages[i].children[ic]);
                                }
                            }
                            tempPage[0].children = children;
                        }
                        
                        if(tempPage[0].children && tempPage[0].children.length == 0){
                            // Remote the children property.
                            delete tempPage[0].children;
                        }
                        
                        pagesNew.push(tempPage[0]);
                        
                    }
                }
         
                data.pages = pagesNew;

                // Store the data.
                App.Data.set("menu", {data:data})
                .success(function(){
                    console.log('stored data');
                       console.log(p);
                    p.success();
                })
                .error(function(){
                    console.log('sync api error',arguments);
                       console.log(p);
                    p.error();
                });
            })
            .error(function(){
                console.log('no data from server');
             
                //p.error();
            });
        }else{
            console.log('no api founded menu');
           // p.error("No api founded! menu");
        }
        return p;
    },
    syncApi: function(apiName){
        var p = new Promise();
        // Check if the api exists.
        if(App.Static.api[apiName]){
            // Sync the api.
            var api = App.Static.api[apiName];
            
            App.Server.get(api.url)
            .success(function(data){
                // Save to the local database.
                console.log('got data');
                App.Data.set(apiName, {data:data})
                .success(function(){
                    console.log('stored data');
                    p.success();
                })
                .error(function(){
                    console.log('sync api error',arguments);
                    p.error();
                });
            })
            .error(function(){
                console.log('no data from server');
                p.error();
            });
        }else{
            p.error("No api founded! " + apiName);
        }
        return p;
    },
    executeQuery: function(query){
        var p = new Promise();
        console.log('execute query', query);
        App.Static.db.transaction(function(tx){
            tx.executeSql(query.query, query.values, function(tx, results){
                //suc
        
                p.success(results);
            },function(){
                //err  
                console.log(arguments);
                p.error();
            });
        }, function(){console.log('execute query transaction',arguments)},
                                 function(){console.log('execute query transaction', arguments);});
        
        return p;
    },
    prepareInsertQuery: function(api, data){
        // Generate.
        var keys = [];
        var subvalues = [];
        var values = [];
        
        // Add the standaard params to the data object.
        for(var key in App.Static.api[api].params){
            if(!data[key]){
                data[key] = App.Static.api[api].params[key];   
            }
        }
        
        // Prepare query.
        for(var key in data){
            keys.push(key);
            if(key === 'data'){
                subvalues.push('?');
                values.push(JSON.stringify(data[key]));
            }else{
                subvalues.push('?');
                values.push(data[key]);
            }
        }
        return {query: 'INSERT INTO '+App.Static.api[api].db+' ('+keys.join()+') VALUES ('+subvalues.join()+');', values: values};
    },
    getApi: function(apiName){
       
            var p = new Promise();
        
        //console.log('GetApi',apiName, 'sender', sender);
        App.Data.executeQuery({query:"SELECT * FROM "+apiName , value:[]})
        .success(function(data){
            
                p.success(data);
           
        })
        .error(function(){
            console.log('err get api');
          
                p.error();
         
                 
            
        });
        
            return p;
        
    },
    syncPages: function(){
        var p = new Promise();
        // Get menu data.
        App.Data.getApi('static')
        .success(function(data){
             // Loop throught pages.
            data = JSON.parse(data.rows.item(0).data);
            var done = 0,
                total = 0;
            for(var page in data.pages){
                if(data.pages[page].title === App.Static.postPage){
                    // Sync the (news)posts.
                    total++;
                    done++;
                    App.Data.syncPosts();
                }else{
                    // Sync a page.
                    total++;
                    App.Data.syncPage(data.pages[page].object_id)
                    .success(function(){
                       done++; 
                       checkComplete();
                    });
                    // Check for children.
                    // If there are children then save then.
                    if(data.pages[page].children){
                        for(var c in data.pages[page].children){
                            total++;
                            App.Data.syncPage(data.pages[page].children[c].object_id) // The title or the normal id won't work because of a bad wordpress json api.
                            .success(function(){
                               done++; 
                               checkComplete();
                            });
                        }
                    }
                }
            }// End of the for-loop.
            var checkComplete = function(){
                if(total === done){
                    p.success();   
                }
            }
        })
        .error(function(){
            
        });
        return p;
    },
    syncPage: function(object_id){
        var p = new Promise(),
            url =  App.Static.api.page.url.replace(/{{page.object_id}}/, object_id);
   
        App.Server.get(url)
        .success(function(data){
            // Save the page.
            App.Data.set('page',{
                id: data.page.id,
                title: data.page.title,
                data:data.page
            })
            .success(function(){
                p.success();
            })
            .error(function(){
                p.error();
            });
        })
        .error(function(){
      
            p.error();
        });
        
        // Return the promise.
        return p;
    },
    syncPosts: function(){    
        var p = new Promise();
        // Get the posts.
        App.Server.get(App.Static.api.post.url)
        .success(function(data){
            // Store the post in the local database one by one.
            var done = 0;
            for(var post in data.posts){
                post = data.posts[post];

                App.Data.set('post',{
                    id: post.id,
                    title: post.title,
                    data: post
                }).success(function(){
                   done++; 
                    checkComplete();
                });
            }
            
            function checkComplete(){
                if(done === data.posts.length){
                    p.success();   
                }
            }   
            return p;
        })
        .error(function(){
            
        });
    },  
    getPage: function(sender, page){
        console.log('GetPage', page);
       // App.Data.getApi('pages')
        App.Data.executeQuery({query:"SELECT * FROM pages WHERE title = '"+page+"' " , value:[]})
        .success(function(data){
           // p.success(JSON.parse(data.rows.item(0).data));
           window.result = data;
            // Search for page.
            if(data.rows.length > 0){
                sender.success(data.rows.item(0));
            }else{
                sender.error();   
            }
            console.log('success',arguments, sender);
            //sender.success(data.rows.item(0));
        })
        .error(function(){
            console.log('err get api');
            sender.error();
        });
    },
    getMenu: function(sender){
        // Get the data.
        App.Data.executeQuery({query:"SELECT * FROM static WHERE type = 'menu'" , value:[]})
        .success(function(data){
            var data = JSON.parse(data.rows.item(0).data),
                menu = [],// {title, children},
                html = document.createElement("ul"),
                pages = [];
            // Loop through the pages.
            for(var p in data.pages){
                var page = data.pages[p],
                    type = 'page', //default.
                    children = [];
                // Check for news page.
                if(page.title == App.Static.postPage){
                    type = 'news';
                }
                // Create base li and a.
                var li = document.createElement("li");
                var a = document.createElement("a");
                a.setAttribute("ontouchstart","AppBridge.execute([],'App.View.open',['"+page.title+"','"+type+"'])");
                a.setAttribute("href","#");
                a.innerHTML = page.title;
                li.appendChild(a);
                // Check for children.
                if(page.children && page.children.length > 0){
                    // Loop through the pages.
                    var ulChild = document.createElement("ul");
                    for(var c in page.children){
                        var liChild = document.createElement("li");
                        var aChild = document.createElement("a");
                        aChild.setAttribute("href","#");
                        aChild.setAttribute("ontouchstart","AppBridge.execute([],'App.View.open',['"+page.children[c].title+"','page'])");
                        aChild.innerHTML = page.children[c].title;
                        liChild.appendChild(aChild);
                        ulChild.appendChild(liChild);
                        li.appendChild(ulChild);
                        pages.push(page.children[c].title);
                       children.push({
                           title: page.children[c].title,
                           type: 'page',
                       });
                    }
                }
                //
                pages.push(page.title);
                menu.push({
                    title: page.title,
                    type: type,
                    children:children
                });
              html.appendChild(li);
            }
            console.log(html, html.outerHTML);
            App.Static.pages = pages;
            if(sender){
                sender.success(menu, html.outerHTML);
            }
        })
        .error(function(){
            console.log('getMenu e get api');
            if(sender){
                sender.error();
            }
        });
    },
    getPosts: function(sender){
        // App.Data.getApi('pages')
        App.Data.executeQuery({query:"SELECT * FROM posts " , value:[]})
        .success(function(data){
           // p.success(JSON.parse(data.rows.item(0).data));
            /*var posts = [];
            // Loop through the posts.
            if(data.rows.length > 0){
                posts.push(data.rows.item(i));
            
            }
            sender.success(posts);
            console.log();*/
            console.log(data, data.rows.length);
            // Search for page.
            if(data.rows.length > 0){
                // Loop and create array.
                var posts = [];
                for(var i = 0; i < data.rows.length; i++){
                    posts.push(data.rows.item(i));
                }
                console.log(posts);
                
                if(sender){ sender.success(posts); };
               
            }else{
                if(sender){ sender.error();};
            }
          
        })
        .error(function(){
            console.log('err get api');
            sender.error();
        });
    },
    getPost: function(){
        
    }
};

// Handles the communication with the server.
App.Server = {
    get:function(url, dontAddBaseUrl){
        if(!dontAddBaseUrl){
            url = App.Static.url + url;
        }
        return $.getJSON(url);   
    }
};

// Handles the views.
App.View = {
    preloaded:{}, // Store all the preloaded views.
    open: function(sender, name, type){
        console.log('type', type);
        if(type == 'page'){
            // Check if the page exists.   
            if(App.Static.pages.indexOf(name) != -1){
                // Open the page view.
                var view = App.View.getView('page',true);
                if(view){
//                    alert('send to page!');
                     window.postMessage({
                        destination: 'view',
                        sender: {
                            view: 'Page',
                            func: 'none',
                            callback: 'listen',
                            state:'success',
                        },
                         args: [name]
                    },'*');
                    steroids.layers.push({
                       navigationBar: false,
                        view: view,
                    });
                }
                return false; // Stop from excuting the rest of this function.
            }
        }else if(type == 'news'){
            // Get the news page.
            name = 'news'
        }
        
        
        var preload = false;
        console.log('App.View.open', name, preload);
        // Check if the view exits.
        if(App.View.exists(name)){
            var view = App.View.getView(name, preload);
            if(view){
             steroids.layers.push({
                navigationBar: false,
                view: view
             });
            }
            // Send the message.
           
            window.postMessage({
                 destination: 'view',
                sender: {
                    view: name,
                    func: 'none',
                    callback: 'onOpen',
                    state:'success',
                },
                 args: []
            },'*');
            
            
        }else{
            // The requested view doesn't exists, we do nothing.
            console.log('the view doesnt exist!');
        }
    },
    // Private.
    getView: function(name, preload){
        // Check if the view is already preloaded.
        if(App.View.preloaded[name]){
            console.log('preloaded');
            return App.View.preloaded[name];   
        }else{
            console.log('not preloaded');
            return new steroids.views.WebView( App.Static.view[name])
        }
    },
    // pop and unload the view.
    close: function(){
        steroids.layers.pop();
    },
    // Pop the current view.
    pop: function(){
         steroids.layers.pop();
    },
    popAll: function(){
        steroids.layers.popAll();  
    },
    replace: function(name){
        this.close();
        this.open(name, true); 
    },
    splashScreen: {
        remove: function(){
            // Send a message to the index page to remove the splashscreen!.
            $('#splashscreen').remove();
        }
    },
    // Preload a view and store it in preloaded.
    preload: function(sender, name){
        console.log('preload');
        if(App.View.exists(name)){
            App.View.preloaded[name] = new steroids.views.WebView(App.Static.view[name]);
            App.View.preloaded[name].preload();
        }
    },
    // Unload a preloaded view.
    unload: function(){
    },
    // Private
    exists: function(name){
        return App.Static.view[name] ? true : false;
    }
};

// Handles everything with the internet connection.
App.Connection = {
     /** 
    * All the types of connections that are possible categorized in 3 classes. 
    * Class 0: No internet connection possible.
    * Class 1: The internet conncetion is trough wifi/ethernet. 
    * Class 2: The internet connection is through cellular. (Keep the datalimit as low as posible, see settings of the app.)
    * @method states 
    * @return {String} The name of the type of connection. 
    * @docs: http://docs.appgyver.com/en/edge/cordova_connection_connection.md.html#Connection
    */ 
    states: { 
        '2g': 2,
        '3g': 2,
        '4g': 2,
        'cellular': 2,
        'ethernet': 1,
        'none': 0,
        'unknown': 0,
        'wifi': 1,
    },
    /** 
    * Initialize the ConnectionHandler (Automaticly done, see last lines of code!). 
    * @method initialize 
    */ 
    initialize: function(){
        // Set the states. 
        
        
        /*
        this.states[Connection.UNKNOWN] = 0;
        this.states[Connection.NONE]    = 0;
        this.states[Connection.ETHERNET]= 1;
        this.states[Connection.WIFI]    = 1;
        this.states[Connection.CELL_2G] = 2;
        this.states[Connection.CELL_3G] = 2;
        this.states[Connection.CELL_4G] = 2;
        this.states[Connection.CELL]    = 2;*/
    },
    /** 
    * Check if there is an internet connection.
    * @method online
    * @return {Boolean} If there is some sort of connection true will be returned, otherwise false will be returned.
    */ 
    online: function(){
       return true;//this.state() === 0 ? false : true;
    },
    /** 
    * Get the type of the current connection.
    * @method type 
    * @return {String} The name of the type of connection. See ConnectionHandler.states!
    */ 
    type: function(){
        // If something went wrong in checking the connection, we say that the device hasn't a connection, just to be sure.
        return navigator.connection.type;
    },
    /** 
    * Get the class of the connection.
    * @method class 
    * @return {Integer} The class of the current connection. See ConnectionHandler.states!
    */
    state: function(){
        return this.states[this.type()] ? this.states[this.type()] : 0;
    }  
};

/* Bridge elements */
var sender = function(data){
    this.data = data;
    this.data.state = undefined;
    this.success = function(){
        this.data.state = 'success';
        App.Bridge.send(this.data, arguments);
    };
    this.error = function(){
        this.data.state = 'error';
        App.Bridge.send(this.data, arguments);
    };
};

// Handles the connection with the AppBridge (views).
App.Bridge = {
    listen: function(){
        // Start listen for some messages!
         window.addEventListener("message", App.Bridge.receiver);
    },
    receiver: function(e){
        // Only listen for messages with the destination of "core";
        console.log('msg');
        if(e.data.destination === 'core'){
            console.log('received', e.data);
            // Execute the function.
            App.Bridge.execute(e.data);
        }
    },
    execute: function(data){
        console.log('exec');
        console.log('SEnder', data, data.sender);
        // 2 methods required!
        if(typeof data.sender.func === 'string'){
            var methods = data.sender.func.split('.'),
                method;
            for(var m in methods){
                
                if(m == 0){
                    method = App; 
                }else{
                    if(method[methods[m]]){
                        method = method[methods[m]];
                        
                        if(m == methods.length-1){
                            data.args.unshift(new sender(data.sender));
                            //data.args.push(new sender(data.sender));
                            method.apply(App, data.args);
                        }
                    }
                }
            }
        }
    },
    send: function(sender, args){
        // Send the data back to the view.
        var sender = arguments[0];
        window.postMessage({
            destination: 'view',
            sender: sender,
            args: args,
        },'*');
    }
};
App.Bridge.listen();


/*
test: function(sender, arg1){
        console.log(arguments);
        arg1+='core';
        //App.Bridge.confirm(sender, arg1);
        var interval = setInterval(function(){
            clearInterval(interval);
            sender.success(arg1);
            sender.error(arg1);
        },1000);
        sender.success(arg1);
    }
*/
