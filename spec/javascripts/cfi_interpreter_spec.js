
describe ('The cfi interpreter', function () {

    var CFIAST;
    var $packageDocument;
    var $contentDocument;

    beforeEach(function () {

        // Generate CFI AST to reference a paragraph in the Moby Dick test features
        CFIAST = EPUBcfi.Parser.parse("epubcfi(/6/14!/4/2/14:4)");

        // Set up package document
        var domParser = new window.DOMParser();
        var packageDocXML = jasmine.getFixtures().read("moby_dick_package.opf");
        $packageDocument = $(domParser.parseFromString(packageDocXML, "text/xml"));

        // Set up content document
        var contentDocXHTML = jasmine.getFixtures().read("moby_dick_content_doc.xhtml");
        $contentDocument = $(domParser.parseFromString(contentDocXHTML, 'text/xml'));

        spyOn($, "ajax").andCallFake(function (params) {

            params.success(domParser.parseFromString(contentDocXHTML, 'text/xml'));
        });
    });

    it ('interprets the cfi string node', function () {

        var $expectedResult = $('#c01p0006', $contentDocument);
        var $result = EPUBcfi.Interpreter.interpretCFIStringNode(CFIAST.cfiString, $packageDocument);

        expect($result).not.toEqual(undefined);
        expect($result).not.toEqual($(''));
    });

    it ('interprets an index step node without an id assertion', function () {

        var $expectedResult = $($('spine', $packageDocument)[0]);
        var $result = EPUBcfi.Interpreter.interpretIndexStepNode(CFIAST.cfiString.path, $($packageDocument.children()[0]));

        expect($result.children()[0]).toEqual($expectedResult.children()[0]);
    });

    it ('interprets an indirection step node without an id assertion', function () {

        // The spy will return the correct content document, so this is more a test of whether this
        // method executes without error, given the starting element.
        var $expectedResult = $($('body', $contentDocument)[0]);
        var $result = EPUBcfi.Interpreter.interpretIndirectionStepNode(
            CFIAST.cfiString.localPath.steps[1], 
            $('<itemref linear="yes" idref="xchapter_001"/>'), 
            $packageDocument);

        expect($result.html()).toEqual($expectedResult.html());
    });

    it ('injects an element for a text terminus with a text location assertion', function () {

        var $expectedResult = 'Ther<span xmlns="http://www.w3.org/1999/xhtml" class="cfi_marker"></span>e now is your insular city of the Manhattoes, belted round by wharves as Indian isles by coral reefs—commerce surrounds it with her surf. Right and left, the streets take you waterward. Its extreme downtown is the battery, where that noble mole is washed by waves, and cooled by breezes, which a few hours previous were out of sight of land. Look at the crowds of water-gazers there.';
        var $result = EPUBcfi.Interpreter.interpretTextTerminusNode(
            CFIAST.cfiString.localPath.termStep,
            $("#c01p0002", $contentDocument));

        expect($result.html()).toEqual($expectedResult);
    });

    // Throws node type errors for each node type
});

describe('cfi interpreter error handling', function () {
    
    describe('interpreter detects "node type" errors in the AST', function () {

        var CFIAST;
        var $packageDocument;
        var $contentDocument;

        beforeEach(function () {

            // Generate CFI AST to reference a paragraph in the Moby Dick test features
            CFIAST = EPUBcfi.Parser.parse("epubcfi(/6/14!/4/2/14:4)");
        });

        it('detects a cfi string "node type" error', function () {

            expect(function () {
                EPUBcfi.Interpreter.interpretCFIStringNode(undefined, undefined)}
            ).toThrow(
                EPUBcfi.NodeTypeError(undefined, "expected CFI string node")
                );
        });

        it('detects an index step "node type" error', function () {

            expect(function () {
                EPUBcfi.Interpreter.interpretIndexStepNode(undefined, undefined)}
            ).toThrow(
                EPUBcfi.NodeTypeError(undefined, "expected index step node")
                );
        });

        it('detects an indirection step "node type" error', function () {

            expect(function () {
                EPUBcfi.Interpreter.interpretIndirectionStepNode(
                    undefined, 
                    $('<itemref linear="yes" idref="xchapter_001"/>'), 
                    undefined)}
            ).toThrow(
                EPUBcfi.NodeTypeError(undefined, "expected indirection step node")
                );
        });

        it('detects a text terminus "node type" error', function () {

            expect(function () {
                EPUBcfi.Interpreter.interpretTextTerminusNode(
                undefined,
                undefined)}
            ).toThrow(
                EPUBcfi.NodeTypeError(undefined, "expected text terminus node")
                );
        });
    });

describe('error handling for id and text assertions', function () {

        var CFIAST;
        var $packageDocument;
        var $contentDocument;

        beforeEach(function () {

            // Set up package document
            var domParser = new window.DOMParser();
            var packageDocXML = jasmine.getFixtures().read("moby_dick_package.opf");
            $packageDocument = $(domParser.parseFromString(packageDocXML, "text/xml"));

            // Set up content document
            var contentDocXHTML = jasmine.getFixtures().read("moby_dick_content_doc.xhtml");
            $contentDocument = $(domParser.parseFromString(contentDocXHTML, 'text/xml'));

            spyOn($, "ajax").andCallFake(function (params) {

                params.success(domParser.parseFromString(contentDocXHTML, 'text/xml'));
            });
        });

        it('detects a mis-match between an id assertion and a target element id, for an index step', function () {

            // Generate CFI AST to reference a paragraph in the Moby Dick test features
            CFIAST = EPUBcfi.Parser.parse("epubcfi(/6/14!/4/2/14[c01p0002]:4)");

            expect(function () {
                EPUBcfi.Interpreter.interpretIndexStepNode(
                CFIAST.cfiString.localPath.steps[3],
                $("section", $contentDocument))}
            ).toThrow(
                EPUBcfi.CFIAssertionError("c01p0002", "c01p0006", "Id assertion failed")
                );
        });

        it('does not throw an error when the id assertion matches the target element id, for an index step', function () {

            // Generate CFI AST to reference a paragraph in the Moby Dick test features
            CFIAST = EPUBcfi.Parser.parse("epubcfi(/6/14!/4/2/14[c01p0006]:4)");

            // Expecting that no error is thrown; if one is, it'll cause this test to fail
            EPUBcfi.Interpreter.interpretIndexStepNode(
                CFIAST.cfiString.localPath.steps[3],
                $("section", $contentDocument));
        });

        it('detects a mis-match between an id assertion and a target element id, for an indirection step', function () {

            // Generate CFI AST to reference a paragraph in the Moby Dick test features
            CFIAST = EPUBcfi.Parser.parse("epubcfi(/6/14!/4[body2]/2/14[c01p0006]:4)");

            expect(function () {
                EPUBcfi.Interpreter.interpretIndirectionStepNode(
                CFIAST.cfiString.localPath.steps[1],
                $('<itemref linear="yes" idref="xchapter_001"/>'),
                $packageDocument)}
            ).toThrow(
                EPUBcfi.CFIAssertionError("body2", "body1", "Id assertion failed")
                );
        });

        it('does not throw an error when the id assertion matches the target element id, for an indirection step', function () {

            // Generate CFI AST to reference a paragraph in the Moby Dick test features
            CFIAST = EPUBcfi.Parser.parse("epubcfi(/6/14!/4[body1]/2/14[c01p0002]:4)");

            // Expecting that no error is thrown; if one is, it'll cause this test to fail
            EPUBcfi.Interpreter.interpretIndirectionStepNode(
                CFIAST.cfiString.localPath.steps[1],
                $('<itemref linear="yes" idref="xchapter_001"/>'),
                $packageDocument);
        });
    });
});