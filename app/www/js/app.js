/* TODO:
App.Database.isEmpty
App.Database.get
Check for internet in the App.Database.sync.
*/
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
        }else{
            this.called['success'] = arguments;
        }
        return this;
    },
    error: function(callback){ 
        if(typeof callback === 'function'){
            this.error = callback;
        }else{
            this.called['error'] = arguments;
        }
        return this;
    },
};

// Control the loading and check if everything is done loading.  (XHR);
var Check = function(){
};
Check.prototype = {
    total: 0,
    times: 0,
    check: function(){
        this.times++;
        if(this.total === this.times){
            this.exec();   
        }
    },
    exec: function(){
        
    }
}

App.Core = {
    initialize: function(forceRefresh){
        // Fire up the data handler.(database and sync)
        App.Database.initialize(forceRefresh); // Params: true -> force refresh;
        this.bindEvents();
    },
    // Start listening for some events.
    bindEvents: function(){
        // REPLACE THE 5 lines of code with the 1 line (outcommented) for production!
        //document.addEventListener('deviceready', App.Event.onDeviceReady);
        if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
            document.addEventListener("deviceready", App.Event.onDeviceReady, false);
        } else {
            App.Event.onDeviceReady();
        }
    },
}; // End of App

App.Event = {
    onDeviceReady: function(){
        // Load the app.
        log.re('device ready');
        if(App.Database.filled === true){
            App.InitialLoading();
        }
        document.addEventListener("backbutton", function(e){
            App.View.pop();
        }, false);
    },
};// End of App.Event

App.View = {
    views: App.Settings.views,
    curViews: [], // The current open views.
    curPos:0,
    open: function(pos){
        this.curPos = pos;
        $('.app').css('-webkit-transform','translateX(-'+(this.curPos*(100/3))+'%)');
    },
    pop: function(){
        if(this.curPos >= 2){
            this.curPos--;
            $('.app').css('-webkit-transform','translateX(-'+(this.curPos*(100/3))+'%)');
        }
    },
    openPage: function(id){
        // Get the data.
        console.log("SELECT * FROM pages WHERE id="+id);
        App.Database.get("SELECT * FROM pages WHERE id="+id)
        .success(function(){
            console.log('openpage success:',JSON.parse(arguments[0][1].rows.item(0).data));
            App.Template.page(JSON.parse(arguments[0][1].rows.item(0).data));
            App.View.open(2);
        })
        .error(function(){
            console.log('openPage error', id); 
        });
    },
    openNews: function(){
        // Get the data.
        App.Database.get("SELECT * FROM posts")
        .success(function(){
            App.Template.news(arguments[0][1].rows);
            App.View.open(2);
        })
        .error(function(){
            console.log('openPage error', id); 
        });
    }
}; // End of App.View

// Data handler.
App.Data = {};
// Handles everything with the local database.
App.Data.Local = {
};

// Handles everything with the server.
App.Data.Server = {
    menu: function(tableName){
        return this.get(App.Settings.server.url + App.Settings.server.apis.menu.url, tableName);
    },
    page: function(id, tableName){
        console.log('page');
       return this.get(App.Settings.server.url + App.Settings.server.apis.page.url.replace('{{page.object_id}}',id), tableName);
    },
    posts: function(tableName){
        return this.get(App.Settings.server.url + App.Settings.server.apis.posts.url, tableName);  
    },
    get: function(url, tableName){
        var p = new Promise();
        $.ajax(url, {
            success: function(){ // Callback.
                if(typeof p.success == 'function'){ p.success(arguments[0], tableName); };
            },
            error: function(){ // Error handling.
                typeof p.error == 'function' ? p.error() : App.Error.ajax('server menu'); 
            }
        });
        return p;
    }
};

// Error Handling.
App.Error = {
    noInternet: function(){
        console.error('NoInternet');
    },
    ajax: function(msg){
        console.error('ajax: '+ msg);   
    },
    database: function(msg){
        console.error('Database Error', arguments);   
    }
};

App.InitialLoading = function(forceRefresh){
    // Load the menu.
    log.re('Initial loading!');
    App.Database.get("SELECT * FROM defaults WHERE type='menu'")
    .success(function(){
        console.log('data',JSON.parse(arguments[0][1].rows.item(0).data));
        App.Template.menu(JSON.parse(arguments[0][1].rows.item(0).data));
        App.View.open(1);
    });
};

App.Template = {
    createMenuElement:function(innerHtml, objectid, news, child){
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.innerHTML = innerHtml;
        a.setAttribute('href','#');
        a.setAttribute('objectid',objectid);
        if(news){
            a.setAttribute('news','true');   
        }else{
            a.setAttribute('page','true');   
        }
        if(child){
            li.className += 'child';   
        }
        li.appendChild(a);
        return li;
    },  
    menu: function(data){
        var html = document.createElement('ul');
        // Generate template.
        var pages = data.pages;
        for(var p in pages){
            p = pages[p];
            if(p.meta && p.meta.app == 'true'){
                var li = App.Template.createMenuElement(p.title, p.object_id, p.meta.nieuws);
                // Check for children.
                 html.appendChild(li);
                var children = p.children;
                if(children && children.length > 0){
                    for(var c in children){
                        c = children[c];
                        if( c &&  c.meta && c.meta.app == 'true'){
                            var lic = App.Template.createMenuElement(c.title, c.object_id, c.meta.nieuws, true);
                            html.appendChild(lic);
                        }
                    }
                }
            }
        }
        console.log(html);
        document.getElementById('menu').getElementsByClassName('content')[0].innerHTML = "";
        document.getElementById('menu').getElementsByClassName('content')[0].appendChild(html);
        $('#menu .content a').on('mousedown', function(){
            console.log($(this));
            if($(this).attr('news') === 'true'){
                App.View.openNews();
            }else{
                App.View.openPage($(this).attr('objectid'));   
            }
        });
    }, // Menu template.
    page: function(data){   
        window.page = data;
        $('#page .content').html(data.content);
    },
    news: function(data){
        var html;
        window.news = data;
        if(news.length > 0){
            html = document.createElement('ul');
            for(var i = 0, len = news.length; i < len; i++){
                var post = JSON.parse(data.item(i).data);
                var li = document.createElement('li');
                var title = document.createElement('h1');
                title.innerHTML = post.title;
                li.appendChild(title);
                var content = document.createElement('div');
                content.innerHTML = post.content;
                li.appendChild(content);
                html.appendChild(li);
            }
            document.getElementById('page').getElementsByClassName('content')[0].innerHTML = "";
            document.getElementById('page').getElementsByClassName('content')[0].appendChild(html);
        }else{
            // No posts.   
        }
    }
};

// Database.
App.Database = {
    db: undefined,
    tx: undefined,
    filled: false,
    forceRefresh: false,
    initialize: function(forceRefresh){
        log.db('database start');
        this.forceRefresh = forceRefresh != undefined ? this.forceRefresh = forceRefresh : false;
        this.create();
    },
    create: function(){
        var database = this.db = window.openDatabase(
            App.Settings.database.name,
            App.Settings.database.version,
            App.Settings.database.displayName,
            App.Settings.database.size);
        // Transaction.
        this.db.transaction(this.transaction, App.Error.database);
    },
    transaction: function(tx){
        App.Database.tx = tx;
        log.db('db transaction', arguments);
        // Check for content.
        // Check for empty.
        if(App.Database.forceRefresh === true){
            App.Database.createTables(tx, true); // Create the tables and sync the database.
        }else{
            App.Database.isEmpty().success(function(){
                App.Database.filled = true; 
                App.InitialLoading();
            })
            .error(function(){
               App.Database.createTables(tx, true); // Create the tables and sync the database. 
            });
        }
    },
    createTables: function(tx, sync){
        log.db('Start creating tables!');
        for(var t in App.Settings.database.table){
            if(t !== 'length'){
             
                tdata = App.Settings.database.table[t];
                var v = [];
                for(var q in tdata){v.push(tdata[q]);};
                App.Database.tx.executeSql('DROP TABLE IF EXISTS '+t);
                App.Database.tx.executeSql('CREATE TABLE '+t+' ('+v.join()+')',
                             function(){
                                App.Error.database('Couldnt create the database');
                             },
                             function(){
                                 check(true);
                             });
            }
        }
        var times = 0,
            check = function(){
            times++;
            if(times == App.Settings.database.table.length){
                // Get all the data from the apis.
                log.db('Tables created!');
                // get the data.
                if(sync){
                    App.Database.sync();
                }
            }
        };
    },
    sync: function(){
        // Check for internet.
        
        log.db('Start syncing!');
        var check = new Check();
        // Loop through the apis.
        for(var a in App.Settings.server.apis){
            if(a != 'length' && a != 'page'){
                check.total++;
                App.Data.Server[a](a).success(function(data, apiName){
                    // Store the data.
                    App.Database.process(apiName, data); // A needs to be redefined!
                    check.check(true);
                    // Store the data.
                }).error(function(){
                    console.log('e'); 
                });
            }
        }
        // Check.
        check.exec = function(){
           log.db('Database is in sync!');
//            App.InitialLoading();
        };
    },
    get: function(query){
        var p = new Promise();
        // Types: page, posts, menu;
        App.Database.db.transaction(function(tx){
           console.log('transaction get');
            tx.executeSql(query, function(){
                // Error.
                log.db('error get'+query);
            },
            function(){
                // Success.
                log.db('Succes get:'+query);
                window.result = arguments;
                p.success(arguments);
            });
        },function(){
            log.db('Transaction get error');
            console.log(arguments);
            p.error();
        }, function(){
             log.db('Transaction get success');
        });
        return p;
    },
    process: function(api, data){
        // Prepare the data for saving to the database.
        var check = new Check();
        if(api === 'menu'){
            App.Database.set("INSERT INTO defaults (type, data) VALUES (?,?)",['menu', JSON.stringify(data)]);
            // Get and Save the pages.
            for(var p in data.pages){
                p = data.pages[p];
                if(p && p.meta && p.meta.app && p.meta.app == 'true' && !p.meta.nieuws){
                    check.total++;
                    App.Database.loadAndSavePage(p.object_id)
                    .success(function(){check.check(true);}).error(function(){App.Error.database("Couldn't save the page");});
                    // Check for children.
                    if(p.children && p.children.length > 0){
                        var children = p.children;
                        for(var child in children){
                            child = children[child];
                            if(child && child.meta && child.meta.app && child.meta.app == 'true' && !child.meta.nieuws){
                                console.log('CHILD', child);  
                                 App.Database.loadAndSavePage(child.object_id)
                                .success(function(){check.check(true);}).error(function(){App.Error.database("Couldn't save the page");});
                            }
                        }
                    }
                }  
            }
            // Check.
            check.exec = function(){
                 log.db('Pages is in sync!'); 
                App.InitialLoading();
            };
        }else if(api === 'posts'){
            // Save the posts.
            for(var p in data.posts){
                App.Database.set("INSERT INTO posts (id, data) VALUES (?,?)",[data.posts[p].id, JSON.stringify(data.posts[p])]);   
            }
        }
    },
    loadAndSavePage: function(object_id){
        // Get and save the page.
        var p = new Promise();
        App.Data.Server.page(object_id)
        .success(function(data){
            // Store the date.
            App.Database.set("INSERT INTO pages (id, data) VALUES(?,?)",[data.page.id, JSON.stringify(data.page)]);
            p.success();
        })
        .error(function(){
            p.error();
        });  
        return p;
    },
    set: function(query, values){
        var p = new Promise();
        this.db.transaction(function(tx){
           tx.executeSql(query, values, function(){
               p.success(arguments);
            },function(){
                App.Error.database("App.Database.set error",arguments);
                p.error(arguments);
            });
         }, App.Error.database);
        return p;
    },
    isEmpty: function(){
        var p = new Promise();
        // Check for all the tables.
        App.Database.get("SELECT name FROM sqlite_master WHERE type='table'")
        .success(function(){
           arguments[0][1].rows.length === 4 ? p.success() : p.error();
        })
        .error(p.error);
        return p;
    }
};

// Debug console.
var d = new Date();
var log = {
    db: function(msg){
        console.log('%c '+msg + " : " +((new Date().getTime() - d) /1000), 'background: green; color: white');  
    },
    re: function(msg){
     console.log('%c '+msg + " : " +((new Date().getTime() - d) /1000), 'background: purple; color: white');    
    }
};