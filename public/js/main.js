// Hide spinner immediately with vanilla JS
(function () {
    function hideSpinner() {
        const spinner = document.getElementById('spinner');
        if (spinner) {
            spinner.classList.remove('show');
            spinner.style.display = 'none';
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hideSpinner);
    } else {
        hideSpinner();
    }
    window.addEventListener('load', hideSpinner);
    setTimeout(hideSpinner, 500);
})();

(function ($) {
    "use strict";

    if (typeof $ === 'undefined' || !$) {
        return;
    }

    // Spinner fallback
    setTimeout(function () {
        if ($('#spinner').length > 0) {
            $('#spinner').removeClass('show');
            $('#spinner').hide();
        }
    }, 1);
    
    // Initiate the wowjs
    if (typeof WOW !== 'undefined') {
        try {
            new WOW().init();
        } catch (e) {
            console.warn('WOW init error:', e);
        }
    }

    // Sticky Navbar
    $(window).scroll(function () {
        if ($(this).scrollTop() > 45) {
            $('.nav-bar').addClass('sticky-top shadow-sm');
        } else {
            $('.nav-bar').removeClass('sticky-top shadow-sm');
        }
    });

    // Hero Header carousel
    if ($.fn.owlCarousel && $(".header-carousel").length) {
        $(".header-carousel").owlCarousel({
            items: 1,
            autoplay: true,
            smartSpeed: 2000,
            center: false,
            dots: false,
            loop: true,
            margin: 0,
            nav : true,
            navText : [
                '<i class="bi bi-arrow-left"></i>',
                '<i class="bi bi-arrow-right"></i>'
            ]
        });
    }

    // ProductList carousel
    if ($.fn.owlCarousel && $(".productList-carousel").length) {
        $(".productList-carousel").owlCarousel({
            autoplay: true,
            smartSpeed: 2000,
            dots: false,
            loop: true,
            margin: 25,
            nav : true,
            navText : [
                '<i class="fas fa-chevron-left"></i>',
                '<i class="fas fa-chevron-right"></i>'
            ],
            responsiveClass: true,
            responsive: {
                0:{
                    items:1
                },
                576:{
                    items:1
                },
                768:{
                    items:2
                },
                992:{
                    items:2
                },
                1200:{
                    items:3
                }
            }
        });
    }

    // ProductList categories carousel
    if ($.fn.owlCarousel && $(".productImg-carousel").length) {
        $(".productImg-carousel").owlCarousel({
            autoplay: true,
            smartSpeed: 1500,
            dots: false,
            loop: true,
            items: 1,
            margin: 25,
            nav : true,
            navText : [
                '<i class="bi bi-arrow-left"></i>',
                '<i class="bi bi-arrow-right"></i>'
            ]
        });
    }

    // Single Products carousel
    if ($.fn.owlCarousel && $(".single-carousel").length) {
        $(".single-carousel").owlCarousel({
            autoplay: true,
            smartSpeed: 1500,
            dots: true,
            dotsData: true,
            loop: true,
            items: 1,
            nav : true,
            navText : [
                '<i class="bi bi-arrow-left"></i>',
                '<i class="bi bi-arrow-right"></i>'
            ]
        });
    }

    // ProductList carousel
    if ($.fn.owlCarousel && $(".related-carousel").length) {
        $(".related-carousel").owlCarousel({
            autoplay: true,
            smartSpeed: 1500,
            dots: false,
            loop: true,
            margin: 25,
            nav : true,
            navText : [
                '<i class="fas fa-chevron-left"></i>',
                '<i class="fas fa-chevron-right"></i>'
            ],
            responsiveClass: true,
            responsive: {
                0:{
                    items:1
                },
                576:{
                    items:1
                },
                768:{
                    items:2
                },
                992:{
                    items:3
                },
                1200:{
                    items:4
                }
            }
        });
    }

    // Product Quantity
    $('.quantity button').on('click', function () {
        var button = $(this);
        var oldValue = button.parent().parent().find('input').val();
        if (button.hasClass('btn-plus')) {
            var newVal = parseFloat(oldValue) + 1;
        } else {
            if (oldValue > 0) {
                var newVal = parseFloat(oldValue) - 1;
            } else {
                newVal = 0;
            }
        }
        button.parent().parent().find('input').val(newVal);
    });

    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });

})(window.jQuery);
