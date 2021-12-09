import previewComponent from './preview.vue';
import PhotoSwipe from 'photoswipe/dist/photoswipe';
import PhotoSwipeUI_Default from 'photoswipe/dist/photoswipe-ui-default';

let $preview;
var vuePhotoPreview = {
	install(Vue, opts) {
		const Preview = Vue.extend(previewComponent);
		var opts = opts || {};
		if (!$preview) {
			$preview = new Preview({el: document.createElement('div')});
			document.body.appendChild($preview.$el);
		}
		let eventName, eventCallback;
		Vue.prototype.$preview = {
			self: null,
			on: (name, callback) => {
				eventName = name;
				eventCallback = callback;
			}
		};
		Vue.mixin({
			data() {
				return {
					galleryElements: null,
					galleryPicLoading: false
				};
			},
			methods: {
				$previewRefresh() {
					setTimeout(() => {
						this.galleryElements = document.querySelectorAll('img[preview]');
						for (var i = 0, l = this.galleryElements.length; i < l; i++) {
							this.galleryElements[i].setAttribute('data-pswp-uid', i + 1);
							this.galleryElements[i].onclick = this.onThumbnailsClick;
						}
					}, 200);

				},
				onThumbnailsClick(e) {
					if (this.galleryPicLoading) {
						return false;
					}
					this.galleryPicLoading = true;
					e = e || window.event;
					e.preventDefault ? e.preventDefault() : e.returnValue = false;

					var eTarget = e.target || e.srcElement;

					function getGallery() {
						var thumbElements;
						var group = eTarget.getAttribute('preview');
						if (group) {
							thumbElements = document.querySelectorAll('img[preview="' + group + '"]');
						} else {
							thumbElements = document.querySelectorAll('img[preview]');
						}
						var output = thumbElements;
						if (opts.loop !== false && output.length === 2) {
							// 需要 loop , 且 当只有两张图片时，复制两份使成为4张，使能循环
							let createEle1 = output[0].cloneNode(true);
							createEle1.src = '';
							createEle1.src = output[0].src;
							let createEle2 = output[0].cloneNode(true);
							createEle2.src = '';
							createEle2.src = output[1].src;
							createEle1.style.display = 'none';
							createEle2.style.display = 'none';
							document.body.appendChild(createEle1);
							document.body.appendChild(createEle2);
							return getGallery();
						} else {
							return output;
						}

					}

					var clickedGallery = getGallery();

					var index;

					for (var i = 0; i < clickedGallery.length; i++) {
						if (clickedGallery[i] === eTarget) {
							index = i;
							break;
						}
					}
					if (index >= 0) {
						this.openPhotoSwipe(index, clickedGallery);
						this.$emit('preview-open', e, eTarget.src);
					}
					return false;
				},
				async openPhotoSwipe(index, galleryElement, disableAnimation, fromURL) {
					var pswpElement = document.querySelectorAll('.pswp')[0],
						gallery,
						options,
						items;

					var items = await this.parseThumbnailElements(galleryElement);
					options = {

						// galleryUID: galleryElement.getAttribute('data-pswp-uid'),

						getThumbBoundsFn: function(index) {
							var thumbnail = items[index].el,
								pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
								rect = thumbnail.getBoundingClientRect();
							return {
								x: rect.left,
								y: rect.top + pageYScroll,
								w: rect.width
							};

						},

						addCaptionHTMLFn: function(item, captionEl, isFake) {
							if (!item.title) {
								captionEl.children[0].innerText = '';
								return false;
							}
							captionEl.children[0].innerHTML = item.title;
							return true;
						},
						showHideOpacity: true,
						history: false,
						shareEl: false,
						maxSpreadZoom: 3,
						getDoubleTapZoom: function(isMouseClick, item) {
							if (isMouseClick) {

								return 1.5;

							} else {
								return item.initialZoomLevel < 0.7 ? 1 : 1.5;
							}
						}

					};

					if (fromURL) {
						if (options.galleryPIDs) {
							// parse real index when custom PIDs are used
							// http://photoswipe.com/documentation/faq.html#custom-pid-in-url
							for (var j = 0; j < items.length; j++) {
								if (items[j].pid == index) {
									options.index = j;
									break;
								}
							}
						} else {
							options.index = parseInt(index, 10) - 1;
						}
					} else {
						options.index = parseInt(index, 10);
					}

					// exit if index not found
					if (isNaN(options.index)) {
						return;
					}
					options = this.extend(options, opts);

					if (disableAnimation) {
						options.showAnimationDuration = 0;
					}

					// Pass data to PhotoSwipe and initialize it
					gallery = this.photoSwipeHandle(pswpElement, PhotoSwipeUI_Default, items, options);
					Vue.prototype.$preview.self = gallery;
					// see: http://photoswipe.com/documentation/responsive-images.html
					var realViewportWidth,
						useLargeImages = false,
						firstResize = true,
						imageSrcWillChange;

					gallery.listen('beforeResize', function() {

						var dpiRatio = window.devicePixelRatio ? window.devicePixelRatio : 1;
						dpiRatio = Math.min(dpiRatio, 2.5);
						realViewportWidth = gallery.viewportSize.x * dpiRatio;

						if (realViewportWidth >= 1200 || (!gallery.likelyTouchDevice && realViewportWidth > 800) || screen.width > 1200) {
							if (!useLargeImages) {
								useLargeImages = true;
								imageSrcWillChange = true;
							}

						} else {
							if (useLargeImages) {
								useLargeImages = false;
								imageSrcWillChange = true;
							}
						}

						if (imageSrcWillChange && !firstResize) {
							gallery.invalidateCurrItems();
						}

						if (firstResize) {
							firstResize = false;
						}

						imageSrcWillChange = false;

					});

					gallery.listen('gettingData', function(index, item) {
						if (item.el.getAttribute('large')) {
							item.src = item.o.src;
							item.w = item.o.w;
							item.h = item.o.h;
						} else {
							item.src = item.m.src;
							item.w = item.m.w;
							item.h = item.m.h;
						}
					});
					gallery.listen('imageLoadComplete', (index, item) => {
						this.galleryPicLoading = false;
					});
					gallery.listen(eventName, eventCallback);
					gallery.init();

					$preview.$el.classList = $preview.$el.classList + ' pswp--zoom-allowed';
				},
				parseThumbnailElements(thumbElements) {
					return new Promise(resolve => {
						var items = [],
							el,
							load = 0,
							item;
						item = {};
						for (var i = 0; i < thumbElements.length; i++) {
							el = thumbElements[i];

							// include only element nodes
							if (el.nodeType !== 1) {
								continue;
							}

							if (typeof el.naturalWidth == 'undefined') {　　 // IE 6/7/8

								var i = new Image();
								i.src = el.src;
								var rw = i.width;
								var rh = i.height;
							} else {　　 // HTML5 browsers

								var rw = el.naturalWidth;
								var rh = el.naturalHeight;
							}
							getImage(i);
							var count = 0;

							function getImage(index) {
								var l = new Image();
								l.src = el.getAttribute('large') ? el.getAttribute('large') : el.getAttribute('src');
								l.text = el.getAttribute('preview-text');
								l.author = el.getAttribute('data-author');
								l.onload = function() {
									item = {
										title: l.text,
										el: thumbElements[index],
										src: l.src,
										w: rw,
										h: rh,
										author: l.author,
										o: {
											src: l.src,
											w: this.width,
											h: this.height
										},
										m: {
											src: l.src,
											w: this.width,
											h: this.height
										}
									};
									items[index] = item;
									count++;
									if (count == thumbElements.length) {
										resolve(items);
									}
								};
							}

						}
					});

					return items;

				},
				extend(o1, o2) {
					for (var prop in o2) {
						o1[prop] = o2[prop];
					}
					return o1;
				},
				initPreview(gallerySelector) {
					this.galleryElements = document.querySelectorAll(gallerySelector);
					for (var i = 0, l = this.galleryElements.length; i < l; i++) {
						this.galleryElements[i].setAttribute('data-pswp-uid', i + 1);
						this.galleryElements[i].onclick = this.onThumbnailsClick;
					}

				},
				photoSwipeHandle(pswpElement, uiClass, items, options) {
					// 处理 RTL 问题，处理两张时候的 loop 问题
					let itemRepeat = items.length === 4 && items[0].src === items[2].src && items[1].src === items[3].src;
					// If no RTL option is requested, just instantiate a new PhotoSwipe the regular way and initialize it.
					if (!options.rtl) {
						var pswp = new PhotoSwipe(pswpElement, uiClass, items, options);
						pswp.init();
						pswp.repeat = itemRepeat;
						pswp.ui.updateIndexIndicator = function() {
							// This code reverses the current index compared to the total number of items in the pswp.
							var total = pswp.repeat ? 2 : pswp.options.getNumItemsFn();
							var current = pswp.getCurrentIndex();
							var separator = pswp.options.indexIndicatorSep;
							current = pswp.repeat ? current % 2 + 1 : current;
							indexIndicatorDOMElement.innerHTML = current + separator + total;
						};
						return pswp;
					}

					// Reverse the items.
					items = items.reverse();

					// Override the start index.
					var itemsIndexMax = items.length - 1;
					var index = options.index || 0; // If not provided, use 0.
					// Now reverse the start index.
					options.index = itemsIndexMax - index;

					// Now instantiate a PhotoSwipe and initialize it, so that we can modify its UI counter.
					var pswp = new PhotoSwipe(pswpElement, uiClass, items, options);
					pswp.init();

					// Get the counter element provided in options, or get it from DOM.
					var indexIndicatorDOMElement = options.indexIndicatorDOMElement || document.querySelectorAll('.pswp__counter')[0];
					pswp.repeat = itemRepeat;

					pswp.ui.updateIndexIndicator = function() {
						// This code reverses the current index compared to the total number of items in the gallery.
						var total = pswp.repeat ? 2 : pswp.options.getNumItemsFn();
						var current = pswp.getCurrentIndex();
						current = pswp.repeat ? (current % 2) : current;
						var reversed = total - current;
						var separator = pswp.options.indexIndicatorSep;
						indexIndicatorDOMElement.innerHTML = reversed + separator + total;
					};
					// force index update
					pswp.ui.updateIndexIndicator();

					return pswp;
				}
			},
			mounted: function() {
				this.initPreview('img[preview]');

			}
		});

	}
};

export default vuePhotoPreview;

if (typeof window !== 'undefined' && !window.vuePhotoPreview) {
	window.vuePhotoPreview = vuePhotoPreview;
}
