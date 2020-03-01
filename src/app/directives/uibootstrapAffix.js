angular.module('ALApp')
.directive('affix', function ($window) {
    return {
        restrict: 'A',
        link: function ($scope, $element) {
            var win = angular.element($window);
            var topOffset = $element[0].offsetTop;
            function affixElement() {
                if ($window.pageYOffset > topOffset) {
                    $element.css('position', 'fixed');
                    $element.css('top', '10px');
                } else {
                    $element.css('position', '');
                    $element.css('top', '');
                }
            }
            $scope.$on('$routeChangeStart', function() {
                win.unbind('scroll', affixElement);
            });
            win.bind('scroll', affixElement);                        
        }
    };
})