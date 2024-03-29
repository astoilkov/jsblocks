﻿define([
  '../core',
  '../query/var/queries',
  '../query/animation',
  '../query/addListener',
  '../query/createVirtual',
  '../query/VirtualElement',
  '../query/Expression'
], function (blocks, queries, animation, addListener, createVirtual, VirtualElement, Expression) {
  blocks.extend(blocks.queries, {
    /**
     * Associates the element with the particular view and creates a $view context property.
     * The View will be automatically hidden and shown if the view have routing. The visibility
     * of the View could be also controlled using the isActive observable property
     *
     * @memberof blocks.queries
     * @param {View} view - The view to associate with the current element
     *
     * @example {html}
     * <!-- Associating the div element and its children with the Profiles view -->
     * <div data-query="view(Profiles)">
     *   <!-- looping through the View users collection -->
     *   <ul data-query="each(users)">
     *     <!-- Using the $view context value to point to the View selectUser handler -->
     *     <li data-query="click($view.selectUser)">{{username}}</li>
     *   </ul>
     * </div>
     *
     * @example {javascript}
     * var App = blocks.Application();
     *
     * App.View('Profiles', {
     *   users: [{ username: 'John' }, { username: 'Doe' }],
     *
     *   selectUser: function (e) {
     *     // ...stuff...
     *   }
     * });
     */
    view: {
      passDomQuery: true,

      preprocess: function (domQuery, view) {
        if (!view.isActive()) {
          this.css('display', 'none');
        } else {
          //view._tryInitialize(view.isActive());
          this.css('display', '');
          if (view._html) {
            blocks.queries.template.preprocess.call(this, domQuery, view._html, view);
          }
          // Quotes are used because of IE8 and below. It fails with 'Expected idenfitier'
          //queries['with'].preprocess.call(this, domQuery, view, '$view');
          //queries.define.preprocess.call(this, domQuery, view._name, view);
        }

        queries['with'].preprocess.call(this, domQuery, view, '$view');
      },

      update: function (domQuery, view) {
        if (view.isActive()) {
          if (view._html) {
            // Quotes are used because of IE8 and below. It fails with 'Expected idenfitier'
            queries['with'].preprocess.call(this, domQuery, view, '$view');

            this.innerHTML = view._html;
            view._children = view._html = undefined;
            blocks.each(createVirtual(this.childNodes[0]), function (element) {
              if (VirtualElement.Is(element)) {
                element.sync(domQuery);
              } else if (element && element.isExpression && element.element) {
                element.element.nodeValue = Expression.GetValue(domQuery._context, null, element);
              }
            });
            domQuery.createElementObservableDependencies(this.childNodes);
          }
          animation.show(this);
        } else {
          animation.hide(this);
        }
      }
    },

    /**
     * Navigates to a particular view by specifying the target view or route and optional parameters
     *
     * @memberof blocks.queries
     * @param {(View|String)} viewOrRoute - the view or route to which to navigate to
     * @param {Object} [params] - parameters needed for the current route
     *
     * @example {html}
     * <!-- will navigate to /contactus because the ContactUs View have /contactus route -->
     * <a data-query="navigateTo(ContactUs)">Contact Us</a>
     *
     * <!-- will navigate to /products/t-shirts because the Products View have /products/{{category}} route -->
     * <a data-query="navigateTo(Products, { category: 't-shirts' })">T-Shirts</a>
     *
     * <!-- the same example as above but the route is directly specifying instead of using the View instance -->
     * <a data-query="navigateTo('/products/{{category}}', { category: 't-shirts' })">T-Shirts</a>
     */
    navigateTo: {
      update: function (viewOrRoute, params) {
        function navigate(e) {
          e = e || window.event;
          e.preventDefault();
          e.returnValue = false;

          if (blocks.isString(viewOrRoute)) {
            window.location.href = viewOrRoute;
          } else {
            viewOrRoute.navigateTo(viewOrRoute, params);
          }
        }

        addListener(this, 'click', navigate);
      }
    },

    trigger: {

    }
  });
});
