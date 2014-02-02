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
        console.log('Device Ready!');
        // Load the app.
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
        };;
    },
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
        var s = {success:undefined, error: undefined};
        $.ajax(App.Settings.server.url + App.Settings.server.apis.menu.url, {
            success: function(){
                // Callback.
                if(typeof s.success == 'function'){ s.success(arguments[0]); };
            },
            error: function(){
                // Error handling.
                typeof s.error == 'function' ? s.error() : App.Error.ajax('server menu'); 
            }
        });
        return s;
    },
    page: function(id){
        var s = {success:undefined, error: undefined};
        console.log(App.Settings.server.url + App.Settings.server.apis.page.url.replace('{{page.object_id}}',id));
        $.ajax(App.Settings.server.url + App.Settings.server.apis.page.url.replace('{{page.object_id}}',id), {
            success: function(){
                // Callback.
                if(typeof s.success == 'function'){ s.success(arguments[0]); };
            },
            error: function(){
                // Error handling.
                typeof s.error == 'function' ? s.error() : App.Error.ajax('server menu'); 
            }
        });
        return s; 
    }
};

// Error Handling.
App.Error = {
    noInternet: function(){
        console.error('NoInternet');
    },
    ajax: function(msg){
        console.error('ajax: '+ msg);   
    }
    
};

App.InitialLoading = function(){
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
        console.log('loaded page', data, data.page.content);   
        $('#page').html(data.page.content);
    }
};