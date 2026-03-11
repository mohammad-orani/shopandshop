/**
 * ============================================================
 *  PRIMEJO - SHARED FOOTER COMPONENT
 *  File: footer.js
 * ============================================================
 */

(function () {

    var currentYear = new Date().getFullYear();

    var footerHTML =
        '<footer class="topbaic-footer">' +
            '<div class="footer-content">' +

                '<div class="footer-section">' +
                    '<h3>PRIMEJO</h3>' +
                    '<p data-en="Our world of shopping, simplified. Premium products, unbeatable value." ' +
                       'data-ar="\u0639\u0627\u0644\u0645 \u0627\u0644\u062a\u0633\u0648\u0642 \u0644\u062f\u064a\u0646\u0627 \u0623\u0635\u0628\u062d \u0623\u0628\u0633\u0637. \u0645\u0646\u062a\u062c\u0627\u062a \u0645\u0645\u064a\u0632\u0629\u060c \u0642\u064a\u0645\u0629 \u0644\u0627 \u062a\u064f\u0636\u0627\u0647\u0649.">' +
                        'Our world of shopping, simplified. Premium products, unbeatable value.' +
                    '</p>' +
                    '<div style="margin-top:20px;">' +
                        '<p style="font-size:13px;color:#999;margin-bottom:8px;">' +
                            '<strong data-en="Contact Us" data-ar="\u0627\u062a\u0635\u0644 \u0628\u0646\u0627">Contact Us</strong>' +
                        '</p>' +
                        '<div class="contact-info">' +
                            '<span class="contact-email" data-email>\uD83D\uDCE7 Loading...</span>' +
                        '</div>' +
                        '<div class="contact-info">' +
                            '<span class="contact-phone" data-phone>\uD83D\uDCDE Loading...</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +

                '<div class="footer-section">' +
                    '<h3 data-en="Quick Links" data-ar="\u0631\u0648\u0627\u0628\u0637 \u0633\u0631\u064a\u0639\u0629">Quick Links</h3>' +
                    '<ul>' +
                        '<li><a href="index.html" data-en="Home" data-ar="\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629">Home</a></li>' +
                        '<li><a href="about.html" data-en="About Us" data-ar="\u0645\u0646 \u0646\u062d\u0646">About Us</a></li>' +
                        '<li><a href="contact.html" data-en="Contact" data-ar="\u0627\u062a\u0635\u0644 \u0628\u0646\u0627">Contact</a></li>' +
                    '</ul>' +
                '</div>' +

                '<div class="footer-section">' +
                    '<h3 data-en="Follow Us" data-ar="\u062a\u0627\u0628\u0639\u0646\u0627">Follow Us</h3>' +
                    '<p data-en="Stay connected on social media" ' +
                       'data-ar="\u0627\u0628\u0642 \u0639\u0644\u0649 \u062a\u0648\u0627\u0635\u0644 \u0639\u0628\u0631 \u0648\u0633\u0627\u0626\u0644 \u0627\u0644\u062a\u0648\u0627\u0635\u0644 \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639\u064a" ' +
                       'style="font-size:13px;margin-bottom:20px;">Stay connected on social media</p>' +

                    '<div class="social-media-links">' +

                        '<a href="https://www.instagram.com/prime_jo2026/" data-social="instagram" target="_blank" rel="noopener" class="social-link" title="Instagram">' +
                            '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">' +
                                '<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>' +
                            '</svg>' +
                            '<span>Instagram</span>' +
                        '</a>' +

                        '<a href="https://web.facebook.com/profile.php?id=61585873581631" data-social="facebook" target="_blank" rel="noopener" class="social-link" title="Facebook">' +
                            '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">' +
                                '<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>' +
                            '</svg>' +
                            '<span>Facebook</span>' +
                        '</a>' +

                        '<a href="https://snapchat.com/add/primejo" data-social="snapchat" target="_blank" rel="noopener" class="social-link" title="Snapchat">' +
                            '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">' +
                                '<path d="M15.943 11.526c-.111-.303-.323-.465-.564-.599a1 1 0 0 0-.123-.064l-.219-.111c-.752-.399-1.339-.902-1.746-1.498a3.4 3.4 0 0 1-.3-.531c-.034-.1-.032-.156-.008-.207a.3.3 0 0 1 .097-.1c.129-.086.262-.173.352-.231.162-.104.289-.187.371-.245.309-.216.525-.446.66-.702a1.4 1.4 0 0 0 .069-1.16c-.205-.538-.713-.872-1.329-.872a1.8 1.8 0 0 0-.487.065c.006-.368-.002-.757-.035-1.139-.116-1.344-.587-2.048-1.077-2.61a4.3 4.3 0 0 0-1.095-.881C9.764.216 8.92 0 7.999 0s-1.76.216-2.505.641c-.412.232-.782.53-1.097.883-.49.562-.96 1.267-1.077 2.61-.033.382-.04.772-.036 1.138a1.8 1.8 0 0 0-.487-.065c-.615 0-1.124.335-1.328.873a1.4 1.4 0 0 0 .067 1.161c.136.256.352.486.66.701.082.058.21.14.371.246l.339.221a.4.4 0 0 1 .109.11c.026.053.027.11-.012.217a3.4 3.4 0 0 1-.295.52c-.398.583-.968 1.077-1.696 1.472-.385.204-.786.34-.955.8-.128.348-.044.743.28 1.075q.18.189.409.31a4.4 4.4 0 0 0 .96.371q.114.03.228.053c.08.016.16.034.238.055.35.098.663.26.878.56.1.141.173.292.252.45.136.275.29.586.57.586.145 0 .299-.05.477-.155a4.4 4.4 0 0 1 .6-.27 3.3 3.3 0 0 1 1.103-.2c.387 0 .74.066 1.103.2.237.085.44.186.6.27.178.104.332.155.477.155.28 0 .434-.311.57-.585.079-.159.152-.31.251-.451.216-.3.529-.462.88-.56.077-.02.157-.039.237-.055q.114-.023.228-.053a4.4 4.4 0 0 0 .96-.371q.23-.12.408-.31c.324-.332.408-.727.28-1.075z"/>' +
                            '</svg>' +
                            '<span>Snapchat</span>' +
                        '</a>' +

                        '<a href="https://youtube.com/@primejo" data-social="youtube" target="_blank" rel="noopener" class="social-link" title="YouTube">' +
                            '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">' +
                                '<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>' +
                            '</svg>' +
                            '<span>YouTube</span>' +
                        '</a>' +

                        '<a href="https://tiktok.com/@primejo" data-social="tiktok" target="_blank" rel="noopener" class="social-link" title="TikTok">' +
                            '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">' +
                                '<path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>' +
                            '</svg>' +
                            '<span>TikTok</span>' +
                        '</a>' +

                    '</div>' +
                '</div>' +

            '</div>' +

            '<div class="footer-bottom">' +
                '<p>&copy; ' + currentYear + ' Primejo. All rights reserved.</p>' +
            '</div>' +
        '</footer>';

    // Inject footer
    var placeholder = document.getElementById('site-footer');
    if (placeholder) {
        placeholder.outerHTML = footerHTML;
    } else {
        document.body.insertAdjacentHTML('beforeend', footerHTML);
    }

    console.log('✅ Footer loaded (' + currentYear + ')');

})();
