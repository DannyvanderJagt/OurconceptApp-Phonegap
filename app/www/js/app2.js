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

App.Core = {
    initialize: function(){
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
        console.re('device ready');
        App.InitialLoading();
    },
};// End of App.Event

App.View = {
    views: App.Settings.views,
    curViews: [], // The current open views.
    curPos:0,
    open: function(pos){
        this.curPos = pos;
        $('.view').css('-webkit-transform','translateX(-'+(this.curPos*100)+'%)');
    },
    pop: function(){
        this.curPos--;
        $('.view').css('-webkit-transform','translateX(-'+(this.curPos*100)+'%)');
    },
    openPage: function(id){
        // Get the data.
        App.Data.Server.page(id).success = function(data){
            App.Template.page(data);
            App.View.open(2);
        };
    },
    openNews: function(){
        
    }
}; // End of App.View

// Data handler.
App.Data = {
    initialize: function(){}
};

// Handles everything with the local database.
App.Data.Local = {
};

// Handles everything with the server.
App.Data.Server = {
    menu: function(){
        return this.get(App.Settings.server.url + App.Settings.server.apis.menu.url);
    },
    page: function(id){
       return this.get(App.Settings.server.url + App.Settings.server.apis.page.url.replace('{{page.object_id}}',id));
    },
    posts: function(){
        return this.get(App.Settings.server.url + App.Settings.server.apis.posts.url);  
    },
    get: function(url, p){
        var p = new Promise();
        $.ajax(url, {
            success: function(){ // Callback.
                if(typeof p.success == 'function'){ p.success(arguments[0]); };
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
    var menu = App.Data.Server.menu();
    menu.success = function(data){
        App.View.open(1);
        App.Template.menu(data);
    };
};

App.Template = {
    menu: function(data){
        console.log(data);
        var html = document.createElement('ul');
        // Generate template.
        var pages = data.pages;
        for(var p in pages){
            p = pages[p];
            if(p.meta && p.meta.app == 'true'){
                var li = document.createElement('li');
                li.innerHTML= p.title;
                li.setAttribute('objectid',p.object_id);
                // Check for children.
                var children = p.children;
                if(children && children.length > 0){
                    var ul = document.createElement('ul');
                    for(var c in children){
                        c = children[c];
                        if( c &&  c.meta && c.meta.app == 'true'){
                            var lic = document.createElement('li');
                            lic.setAttribute('objectid',c.object_id);
                            lic.innerHTML =  c.title;
                            ul.appendChild(lic);
                        }
                    }
                    li.appendChild(ul);
                }
                html.appendChild(li);
            }
        }
        console.log(html);
        document.getElementById('menu').appendChild(html);
        $('li').on('click', function(){
            console.log($(this));
            App.View.openPage($(this).attr('objectid'));
        });
    }, // Menu template.
    page: function(data){   
        $('#page').html(data.page.content);
    },
    news: function(data){
        var html = document.createElement('ul');
        document.getElementById('page').appendChild(html);
    }
};

// Database.
App.Database = {
    db: undefined,
    forceRefresh: false,
    initialize: function(forceRefresh){
        console.db('database start');
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
        console.log('db transaction', arguments);
        App.Database.createTables(tx);
    },
    createTables: function(tx){
        for(var t in App.Settings.database.table){
            if(t !== 'length'){
                tdata = App.Settings.database.table[t];
                var v = [];
                for(var q in tdata){v.push(tdata[q]);};
                tx.executeSql('DROP TABLE IF EXISTS '+t);
                tx.executeSql('CREATE TABLE '+t+' ('+v.join()+')',
                             function(){
                                console.log('e');
                                App.Error.database('Couldnt create the database');
                             },
                             function(){
                                console.log('s');   
                                 check(true);
                             });
            }
        }
        var times = 0,
            check = function(){
            times++;
            if(times == App.Settings.database.table.length){
                console.log('Checked');
                if(App.Database.forceRefresh){
                    // Get all the data from the apis.
                    console.db('Tables created!');
                    // get the data.
                    App.Database.sync();
                }
            }
        };
    },
    sync: function(){
        // Loop through the apis.
        for(var a in App.Settings.server.apis){
            console.log(a); 
            if(a != 'length' && a != 'page'){
                console.log(App.Data.Server[a]);
                App.Data.Server[a]().success(function(){
                    console.log('s',arguments);
                    // Store the data.
                }).error(function(){
                    console.log('e'); 
                });
            }
        }
        
    },
    get: function(){
    },
    set: function(){
    }
};




// Debug console.
var d = new Date();
window.console.db = function(msg){
    console.log('%c '+msg + " : " +((new Date().getTime() - d) /1000), 'background: green; color: white');   
}
window.console.re = function(msg){
    console.log('%c '+msg + " : " +((new Date().getTime() - d) /1000), 'background: purple; color: white');   
}