
$.fn.changeElementType = function (newType) {

    var newElements, attrs, newElement;

    this.each(function () {
        
        attrs = {};

        $.each(this.attributes, function () {
            attrs[this.nodeName] = this.nodeValue;
        });

        newElement = $("<" + newType + "/>", attrs).append( $(this).contents() );

        $(this).replaceWith(newElement);

        if (!newElements)

            newElements = newElement;

        else

            $.merge(newElements, newElement);
    });

    return $(newElements);
};

