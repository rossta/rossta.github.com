@woniesong92 Thanks for asking. The question of how to best optimize your bundling strategy deserves a lot of attention. I'm planning to write more about this subject in the near future. What follows are some highlights.

### Assumptions

It sounds like you've already decided to split up your main bundle into smaller ones, so you're at the next step which is "What's the best way to split it up?"

Before you can answer that question, we need to establish a few assumptions I'll have to make without knowing your application.

I'll assume, from what you've described, that you are building a "multi-page application": server-side routing and a separate HTML views with some client-side rendering.

This is different from a single-page application in which all the routing and rendering is performed on the client side. The reason for the distinction is that bundling advice may differ depending on the context.

### Measurement

Since you're talking about optimizing through multiple packs, I'll also assume you're interested in performance, i.e., sending only the code your users need improve the user experience.

Any discussion of performance optimization should include some data analysis. I'd recommend having a baseline of frontend user metrics, which you may be able to get with a monitoring tool like New Relic or even Google Analytics. There's also [Lighthouse](https://developers.google.com/web/tools/lighthouse) which can give you some solid recommendations and estimate user metric scores over an emulated throttled network connection.

### Visualization

I would also (right away) install the [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer). (I used this tool to compare the bundle sizes in development and production in [your question about `antd`](https://github.com/rails/webpacker/issues/2594)). If I were you, I'd want to know what's going on in each of these packs you're using.  As you saw in the other thread, you'd want to run this tool against your production build.

### Discovery

(If you're not already using the "split chunks" optimization, this next part is very important.)

Pay close attention to what you see in the bundle analysis. When you start using multiple packs, you might be surprised what you see, namely, that you are bundling some of the same modules, like React in your case, _in every pack_. Why? Because you haven't instructed webpack to share modules across your bundles, i.e., webpack doesn't assume by default you have a multi-page application.

<img width="2032" alt="Screen Shot 2020-05-18 at 9 36 18 PM" src="https://user-images.githubusercontent.com/11673/82275028-ba94c700-994f-11ea-931d-7c84ee6e4bc5.png">

Look closely and you can see react-dom in all three bundles. This is, at best, a bad UX, since you're forcing the user to download the same module(s) on different pages in different bundles, and at worst, a source of confounding bugs, especially when using multiple packs on a single page.

### Split Chunks

Let's assume you've got your head wrapped around the problem... how do you solve it? For a multi-page application, [webpack recommends](https://webpack.js.org/concepts/entry-points/#multi-page-application) the [splitChunks optimization](https://webpack.js.org/plugins/split-chunks-plugin/).

I won't go into too much detail about this API, which provides a number of options to play with, but it's easy enough to [enable it through the Webpacker config](https://github.com/rails/webpacker/blob/master/docs/webpack.md#add-splitchunks-webpack-v4):

```js
environment.splitChunks()
```
The result might looks something like this:
<img width="2032" alt="Screen Shot 2020-05-18 at 9 46 50 PM" src="https://user-images.githubusercontent.com/11673/82275591-24fa3700-9951-11ea-885c-1dd20794b867.png">

Notice it created _more bundles_ without the duplication. To correctly render a given page, there are some "vendor" packs and some shared bundles that webpack spits out to go with your explicit entry points. This is why the splitChunks optimization requires separate view helpers for rendering the javascript and stylesheet tags, e.g. https://github.com/rails/webpacker/blob/22ab02b7c84e917f985ecc76f5916d144f43bfbf/lib/webpacker/helper.rb#L102-L104

Webpack does the splitting in away so that the modules can be shared across bundles. Your application will now render _more_ bundles at a reduced cost across multiple pages (and even more so in a single page if your CDN provider has HTTP/2 enabled).

### What now?

From here, you now have the tools to figure out the answer to your own question: How do I load JavaScript packs in the most optimized way? I won't be able to tell you how fine-grained your packs should be. There's a tradeoff to how much splitting you can do before you see diminishing returns. You'll have to see what works best for your application.

Hope that's helpful.



