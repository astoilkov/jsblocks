describe('blocks.MvcRouter', function () {
    function createRouter() {
        return new blocks.core.Router();
    }

    describe('registerRoute()', function () {
        it('', function () {
            var router = createRouter();
            expect(router.registerRoute('posts')).toBe('posts');
        });

        //it('', function () {
        //    var router = createRouter();
        //    expect(router.registerRoute()).toBe('/');
        //});

        it('', function () {
            var router = createRouter();
            var postsRouteId = router.registerRoute('posts');
            var postRouteId = router.registerRoute('/post', postsRouteId);
            var detailsRouteId = router.registerRoute('/details', postRouteId);

            expect(postsRouteId).toBe('posts');
            expect(postRouteId).toBe('posts/post');
            expect(detailsRouteId).toBe('posts/post/details');
        });

        it('', function () {
            var router = createRouter();
            expect(router.registerRoute('post/{{id}}')).toBe('post/{{id}}');
        });

        it('products/', function () {
            var router = createRouter();
            var routeId = router.registerRoute('products/');

            expect(routeId).toBe('products/');
        });

        it('products/t-shirts', function () {
            var router = createRouter();
            var routeId = router.registerRoute('products/t-shirts');

            expect(routeId).toBe('products/t-shirts');
        });

        it('products/t-shirts/', function () {
            var router = createRouter();
            var routeId = router.registerRoute('products/t-shirts/');

            expect(routeId).toBe('products/t-shirts/');
        });

        it('products/skirts/id-{{id}}/view-{{view}}', function () {
            var router = createRouter();
            var routeId = router.registerRoute('products/skirts/id-{{id}}/view-{{view}}');

            expect(routeId).toBe('products/skirts/id-{{id}}/view-{{view}}');
        });

        it('routeId is case sensitive', function () {
            var router = createRouter();
            var routeId = router.registerRoute('ProDucts/?{{id}}/*{{view}}');

            expect(routeId).toBe('ProDucts/?{{id}}/*{{view}}');
        });
    });

    describe('routeFrom()', function () {
        it('products', function () {
            var router = createRouter();
            var routeId = router.registerRoute('products');
            var routeData = router.routeFrom('products');

            expect(routeData).toEqual([{ id: routeId, params: {} }]);
        });

        it('products/', function () {
            var router = createRouter();
            var routeId = router.registerRoute('products/');
            var routeData = router.routeFrom('products/');

            expect(routeData).toEqual([{ id: routeId, params: {} }]);
        });

        it('products/t-shirts', function () {
            var router = createRouter();
            var routeId = router.registerRoute('products/t-shirts');
            var routeData = router.routeFrom('products/t-shirts');

            expect(routeData).toEqual([{ id: routeId, params: {} }]);
        });

        it('products/t-shirts/', function () {
            var router = createRouter();
            var routeId = router.registerRoute('products/t-shirts/');
            var routeData = router.routeFrom('products/t-shirts/');

            expect(routeData).toEqual([{ id: routeId, params: {} }]);
        });

        it('products/{{id}}', function () {
            var router = createRouter();
            var routeId = router.registerRoute('products/{{id}}');
            var routeData = router.routeFrom('products/1');

            expect(routeData).toEqual([{
                id: routeId,
                params: {
                    id: '1'
                }
            }]);
        });

        it('products/{{id}}', function () {
            var router = createRouter();
            var route = blocks
                .route('products/{{id}}')
                .optional('id');
            var routeId = router.registerRoute(route);
            var routeData = router.routeFrom('products/1a3');

            expect(routeData).toEqual([{
                id: routeId,
                params: {
                    id: '1a3'
                }
            }]);
        });

        it('products/{{id}} without specifying the parameter', function () {
            var router = createRouter();
            var route = blocks
                .route('products/{{id}}')
                .optional('id');
            var routeId = router.registerRoute(route);
            var routeData = router.routeFrom('products/');

            expect(routeData).toEqual([{
                id: routeId,
                params: {
                    id: undefined
                }
            }]);
        });

        it('products/{{data}}', function () {
            var router = createRouter();
            var route = blocks
                .route('products/{{data}}')
                .wildcard('data');
            var routeId = router.registerRoute(route);
            var routeData = router.routeFrom('products/data-could-be/anything');

            expect(routeData).toEqual([{
                id: routeId,
                params: {
                    data: 'data-could-be/anything'
                }
            }]);
        });

        it('products/skirts/{{id}}/{{view}}', function () {
            var router = createRouter();
            var routeId = router.registerRoute('products/skirts/{{id}}/{{view}}');
            var routeData = router.routeFrom('products/skirts/17/swimsuits');

            expect(routeData).toEqual([{
                id: routeId,
                params: {
                    id: '17',
                    view: 'swimsuits'
                }
            }]);
        });

        it('products/skirts/{{id}}/*{{view}}', function () {
            var router = createRouter();
            var route = blocks
                .route('products/skirts/{{id}}/{{view}}')
                .wildcard('view');
            var routeId = router.registerRoute(route);
            var routeData = router.routeFrom('products/skirts/3/#every/thing');

            expect(routeData).toEqual([{
                id: routeId,
                params: {
                    id: '3',
                    view: '#every/thing'
                }
            }]);
        });

        it('products/all/?{{id}}/*{{view}}', function () {
            var router = createRouter();
            var route = blocks
                .route('products/all/{{id}}/{{view}}')
                .optional('id')
                .wildcard('view');
            var routeId = router.registerRoute(route);
            var routeData = router.routeFrom('products/all/3/#every/thing');

            expect(routeData).toEqual([{
                id: routeId,
                params: {
                    id: '3',
                    view: '#every/thing'
                }
            }]);
        });

        it('products/all/?{{id}}/{{view}} (without specifying the first parameter)', function () {
            var router = createRouter();
            var route = blocks
                .route('products/all/{{id}}/{{view}}')
                .optional('id')
                .wildcard('view');
            var routeId = router.registerRoute(route);
            var routeData = router.routeFrom('products/all/3/');

            expect(routeData).toEqual([{
                id: routeId,
                params: {
                    view: '3/'
                }
            }]);
        });

        it('products/all/{{id}}/?{{view}} (without specifying the second parameter)', function () {
            var router = createRouter();
            var route = blocks
                .route('products/all/{{id}}/{{view}}')
                .optional('view');
            var routeId = router.registerRoute(route);

            var routeData = router.routeFrom('products/all/3');

            expect(routeData).toEqual([{
                id: routeId,
                params: {
                    id: '3'
                }
            }]);
        });

        // TODO: Fix the test
        //it('products/all/?{{id}}/?{{view}} (specifying only one of the optional parameters)', function () {
        //    var router = createRouter();
        //    var route = blocks
        //        .route('products/all/{{id}}/{{view}}')
        //        .optional('id')
        //        .optional('view');
        //    var routeId = router.registerRoute(route);
        //    var routeData = router.routeFrom('products/all/3/');
        //
        //    expect(routeData).toEqual([{
        //        id: routeId,
        //        params: {
        //            id: '3'
        //        }
        //    }]);
        //});

        it('products/all/?{{id}}/?{{view}} (without specifying both parameters)', function () {
            var router = createRouter();
            var route = blocks
                .route('products/all/{{id}}/{{view}}')
                .optional('id')
                .optional('view');
            var routeId = router.registerRoute(route);
            var routeData = router.routeFrom('products/all');

            expect(routeData).toEqual([{
                id: routeId,
                params: { }
            }]);
        });

        it('products/all/?{{id}}/?{{view}}', function () {
            var router = createRouter();
            var route = blocks
                .route('products/all/{{id}}/{{view}}')
                .optional('id')
                .optional('view');
            router.registerRoute(route);

            expect(router.routeFrom('products/all/3/#every/thing')).toBe(null);
        });

        it('products/skirts/{{id}}/{{view}} (returns null when passing route that does not exist)', function () {
            var router = createRouter();
            router.registerRoute('product/skirts/{{id}}/{{view}}');

            expect(router.routeFrom('product/skirts/1/')).toBe(null);
        });

        it('without registering a route', function () {
            var router = createRouter();
            expect(router.routeFrom('products/skirts/3')).toBe(null);
        });

        it('routeName is not case sensitive', function () {
            var router = createRouter();
            var routeId = router.registerRoute('PROducts/SkirtS/{{id}}/{{view}}');
            var routeData = router.routeFrom('producTS/skiRts/17/swimsuits');

            expect(routeData).toEqual([{
                id: routeId,
                params: {
                    id: '17',
                    view: 'swimsuits'
                }
            }]);
        });

        it('parameters are case sensitive', function () {
            var router = createRouter();
            var routeId = router.registerRoute('PROducts/SkirtS/{{Id}}/{{View}}');
            var routeData = router.routeFrom('producTS/skiRts/17/SwimsuitS');

            expect(routeData).toEqual([{
                id: routeId,
                params: {
                    Id: '17',
                    View: 'SwimsuitS'
                }
            }]);
        });
    });

    describe('routeFrom() hierarchy', function () {
        it('', function () {
            var router = createRouter();
            var route = blocks.route('posts/{{view}}/pro').optional('view');
            var detailRoute = blocks.route('/{{bro}}/ho').optional('bro');
            var routeId = router.registerRoute(route);
            var detailRouteId = router.registerRoute(detailRoute, route);

            expect(router.routeFrom('posts/pro/ho')).toEqual([{
                id: routeId,
                params: {}
            }, {
                id: detailRouteId,
                params: {}
            }]);
        });
    });

    describe('routeTo()', function () {
        it('products', function () {
            var router = createRouter();
            var routeId = router.registerRoute('products');

            expect(router.routeTo(routeId)).toBe('products');
        });

        it('products/{{id}}/{{type}}', function () {
            var router = createRouter();
            var routeId = router.registerRoute('products/{{id}}/{{type}}');

            var url = router.routeTo(routeId, {
                id: 3,
                type: 'skirt'
            });

            expect(url).toBe('products/3/skirt');
        });

        it('products/{{id}}/{{detailId}}/{{type}}', function () {
            var router = createRouter();
            var routeId = router.registerRoute('products/{{id}}/{{detailId}}/{{type}}');

            var url = router.routeTo(routeId, {
                id: 3,
                detailId: 1,
                type: 'all'
            });
            expect(url).toBe('products/3/1/all');
        });

        it('does not lowerCase the route', function () {
            var router = createRouter();
            var routeId = router.registerRoute('Products/{{type}}/{{id}}');

            var url = router.routeTo(routeId, {
                type: 'Skirts',
                id: 1
            });

            expect(url).toBe('Products/Skirts/1');
        });
    });

    describe('GenerateRoute()', function () {

    });
});
