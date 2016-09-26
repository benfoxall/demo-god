# demo-god
A demo platform

## Flow

#### Browser

1. login
2. post demo.foo/key
3. npm instructions & waiting ui
8. post config to localhost:$PORT

#### CLI

4. demo-god key
5. create local server on port $PORT
6. post demo.foo/key/:link/:$PORT
8. create ~/Demo/foo
7. store config ~/Demo/foo/.demo-config
9. on index.html save, POST demo.foo/key

#### Backend

7. trigger 'key-setup', 'link', {port: $PORT}
