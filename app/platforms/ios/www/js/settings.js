App = window.App;
// Create "App" global variable if it doesn't exists already. 
if(!App){
    App = {};
}
// Settings.
window.App.Settings = {
    server: {
        url: "http://ourconcepts.serverict.nl/",
        apis: {
            menu : {
                db: 'defaults',
                params: {
                    type: 'menu'
                },
                url: '?json=get_menu_structure&callback=?'
            },
            page: {
                db: 'pages',
                params: {
                },
                url: "?json=get_page&id={{page.object_id}}&callback=?"
            },
            post: {
                db: "posts",
                params:{
                },
                url: "?json=get_posts&callback=?",
            }
        }
    },
    database: {
        table: {
            defaults: {
                type: "type unique",
                data: "data"
            },
            pages: {
                id: "id unique",
                title: "title",
                data: "data"
            },
            posts: {
                id: "id unique",
                title: "title",
                data: "data"
            }
        }
    },
    views: { // Automatic prepended "#" (Only html elements with id's!)
        loading: "loading",
        menu: "menu",
        page: "page",
        news: "news"
    }
};