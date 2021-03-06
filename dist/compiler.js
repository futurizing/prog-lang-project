(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.ProgLangCompiler = global.ProgLangCompiler || {})));
}(this, (function (exports) { 'use strict';

var ExpressionOperator;
(function (ExpressionOperator) {
    ExpressionOperator[ExpressionOperator["Plus"] = 0] = "Plus";
    ExpressionOperator[ExpressionOperator["And"] = 1] = "And";
    ExpressionOperator[ExpressionOperator["Divide"] = 2] = "Divide";
    ExpressionOperator[ExpressionOperator["EqualTo"] = 3] = "EqualTo";
    ExpressionOperator[ExpressionOperator["GreaterThan"] = 4] = "GreaterThan";
    ExpressionOperator[ExpressionOperator["GreaterThanOrEqualTo"] = 5] = "GreaterThanOrEqualTo";
    ExpressionOperator[ExpressionOperator["LessThan"] = 6] = "LessThan";
    ExpressionOperator[ExpressionOperator["LessThanOrEqualTo"] = 7] = "LessThanOrEqualTo";
    ExpressionOperator[ExpressionOperator["Minus"] = 8] = "Minus";
    ExpressionOperator[ExpressionOperator["Modulo"] = 9] = "Modulo";
    ExpressionOperator[ExpressionOperator["Multiply"] = 10] = "Multiply";
    ExpressionOperator[ExpressionOperator["Not"] = 11] = "Not";
    ExpressionOperator[ExpressionOperator["NotEqualTo"] = 12] = "NotEqualTo";
    ExpressionOperator[ExpressionOperator["Or"] = 13] = "Or";
})(ExpressionOperator || (ExpressionOperator = {}));

var BaseCodeGenerator = (function () {
    function BaseCodeGenerator(program) {
        this.program = program;
    }
    return BaseCodeGenerator;
}());

var __extends = (undefined && undefined.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INDENT_STR = '\t';
var NEWLINE_STR = '\n';
var ECMAScriptCodeGenerator = (function (_super) {
    __extends(ECMAScriptCodeGenerator, _super);
    function ECMAScriptCodeGenerator() {
        _super.apply(this, arguments);
        this.currentIndentLevel = 0;
    }
    ECMAScriptCodeGenerator.prototype.getIndenter = function () {
        var indenter = '';
        for (var i = 0; i < this.currentIndentLevel; i++) {
            indenter += INDENT_STR;
        }
        return indenter;
    };
    ECMAScriptCodeGenerator.prototype.indent = function () {
        this.currentIndentLevel++;
    };
    ECMAScriptCodeGenerator.prototype.unindent = function () {
        this.currentIndentLevel--;
    };
    ECMAScriptCodeGenerator.prototype.wrapLineOfCode = function (codeLine) {
        return this.getIndenter() + codeLine + NEWLINE_STR;
    };
    ECMAScriptCodeGenerator.prototype.generateCode = function () {
        var output = '';
        for (var _i = 0, _a = this.program.instructions; _i < _a.length; _i++) {
            var instruction = _a[_i];
            if (instruction.type === 'Function') {
                output += this.generateFunction(instruction);
            }
            else {
                output += this.generateStatement(instruction);
            }
        }
        return output;
    };
    ECMAScriptCodeGenerator.prototype.generateFunction = function (fn) {
        var output = '';
        var params = fn.parameters.map(function (param) { return param.name; }).join(', ');
        output += this.wrapLineOfCode("function " + fn.functionName + " (" + params + ") {");
        this.indent();
        output += this.generateStatements(fn.statements);
        this.unindent();
        output += this.wrapLineOfCode("}");
        return output;
    };
    ECMAScriptCodeGenerator.prototype.generateStatements = function (statements) {
        var content = '';
        for (var i = 0; i < statements.length; i++) {
            content += this.generateStatement(statements[i]);
        }
        return content;
    };
    ECMAScriptCodeGenerator.prototype.generateStatement = function (statement) {
        var _this = this;
        switch (statement.type) {
            case 'VariableDeclaration':
                var declaration = "var " + statement.variableName;
                if (statement.initialValue !== undefined) {
                    declaration += " = " + this.generateExpression(statement.initialValue);
                }
                return this.wrapLineOfCode(declaration + ";");
            case 'AssignmentSet': {
                return this.wrapLineOfCode(statement.variableName + " = " + this.generateExpression(statement.value) + ";");
            }
            case 'AssignmentIncrease': {
                return this.wrapLineOfCode(statement.variableName + " += " + this.generateExpression(statement.value) + ";");
            }
            case 'AssignmentDecrease': {
                return this.wrapLineOfCode(statement.variableName + " -= " + this.generateExpression(statement.value) + ";");
            }
            case 'PrintStatement': {
                return this.wrapLineOfCode("VM.print(" + this.generateExpression(statement.value) + ");");
            }
            case 'IfBlock': {
                var content = this.wrapLineOfCode("if (" + this.generateExpression(statement.ifBlocks[0].condition) + ") {");
                this.indent();
                content += this.generateStatements(statement.ifBlocks[0].statements);
                this.unindent();
                for (var i = 1; i < statement.ifBlocks.length; i++) {
                    content += this.wrapLineOfCode("} else if (" + this.generateExpression(statement.ifBlocks[i].condition) + ") {");
                    this.indent();
                    content += this.generateStatements(statement.ifBlocks[i].statements);
                    this.unindent();
                }
                if (statement.elseBlockStatements !== undefined) {
                    content += this.wrapLineOfCode("} else {");
                    this.indent();
                    content += this.generateStatements(statement.elseBlockStatements);
                    this.unindent();
                }
                content += this.wrapLineOfCode('}');
                return content;
            }
            case 'WhileBlock': {
                var block = this.wrapLineOfCode("while (" + this.generateExpression(statement.condition) + ") {");
                this.indent();
                block += this.generateStatements(statement.statements);
                this.unindent();
                block += this.wrapLineOfCode("}");
                return block;
            }
            case 'ForBlock': {
                var i = statement.iteratorName;
                var from = this.generateExpression(statement.iteratorFrom);
                var to = this.generateExpression(statement.iteratorTo);
                var block = this.wrapLineOfCode("for (var " + i + " = " + from + "; " + i + " <= " + to + "; " + i + "++) {");
                this.indent();
                block += this.generateStatements(statement.statements);
                this.unindent();
                block += this.wrapLineOfCode("}");
                return block;
            }
            case 'FunctionCall': {
                var args = statement.callArguments.map(function (arg) { return _this.generateExpression(arg); }).join(', ');
                var content = statement.functionName + "(" + args + ");";
                if (statement.resultTarget !== undefined) {
                    content = statement.resultTarget + " = " + content;
                }
                return this.wrapLineOfCode(content);
            }
            case 'FunctionReturn': {
                return this.wrapLineOfCode("return " + this.generateExpression(statement.returnValue) + ";");
            }
        }
    };
    ECMAScriptCodeGenerator.prototype.generateExpression = function (exp) {
        if (exp.type === 'ExpressionAtom') {
            var atom = exp;
            switch (atom.atomType) {
                case 'Number': return atom.value;
                case 'String': return JSON.stringify(atom.value);
                case 'Boolean': return atom.value ? 'true' : 'false';
                case 'Variable': return atom.variableName;
            }
            throw new Error('Invalid expression.');
        }
        else if (exp.type === 'Expression') {
            var e = exp;
            var r = this.generateExpression(e.rightValue);
            if (e.operator === ExpressionOperator.Not) {
                return "!" + r;
            }
            var l = this.generateExpression(e.leftValue);
            switch (e.operator) {
                case ExpressionOperator.And: return l + " && " + r;
                case ExpressionOperator.Or: return l + " || " + r;
                case ExpressionOperator.Plus: return l + " + " + r;
                case ExpressionOperator.Minus: return l + " - " + r;
                case ExpressionOperator.Multiply: return l + " * " + r;
                case ExpressionOperator.Divide: return l + " / " + r;
                case ExpressionOperator.Modulo: return l + " % " + r;
                case ExpressionOperator.EqualTo: return l + " === " + r;
                case ExpressionOperator.NotEqualTo: return l + " !== " + r;
                case ExpressionOperator.GreaterThan: return l + " > " + r;
                case ExpressionOperator.GreaterThanOrEqualTo: return l + " >= " + r;
                case ExpressionOperator.LessThan: return l + " < " + r;
                case ExpressionOperator.LessThanOrEqualTo: return l + " <= " + r;
            }
            throw new Error('Invalid expression.');
        }
        else {
            throw new Error('Invalid expression.');
        }
    };
    return ECMAScriptCodeGenerator;
}(BaseCodeGenerator));

var LineMapper = (function () {
    function LineMapper(sourceCode) {
        this.sourceCode = sourceCode;
        this.lineStartPos = [0];
        var curPos = -1;
        while (true) {
            curPos = this.getNextNewlinePosition(curPos + 1);
            if (curPos === -1) {
                break;
            }
            this.lineStartPos.push(curPos);
        }
    }
    LineMapper.prototype.getNextNewlinePosition = function (curPos) {
        var pos = this.sourceCode.indexOf('\r', curPos);
        if (pos !== -1) {
            return pos;
        }
        pos = this.sourceCode.indexOf('\n', curPos);
        if (pos !== -1) {
            return pos;
        }
        pos = this.sourceCode.indexOf('\r\n', curPos);
        if (pos !== -1) {
            return pos;
        }
        return -1;
    };
    LineMapper.prototype.getLineAndCol = function (pos) {
        // TODO: Use binary search instead
        for (var i = 0; i < this.lineStartPos.length; i++) {
            if (pos < this.lineStartPos[i]) {
                return {
                    line: i,
                    col: pos - this.lineStartPos[i - 1]
                };
            }
        }
        return {
            line: this.lineStartPos.length,
            col: pos - this.lineStartPos[this.lineStartPos.length - 1]
        };
    };
    return LineMapper;
}());

var TokenType;
(function (TokenType) {
    TokenType[TokenType["Plus"] = 0] = "Plus";
    TokenType[TokenType["And"] = 1] = "And";
    TokenType[TokenType["As"] = 2] = "As";
    TokenType[TokenType["BooleanValueFalse"] = 3] = "BooleanValueFalse";
    TokenType[TokenType["BooleanValueTrue"] = 4] = "BooleanValueTrue";
    TokenType[TokenType["ButIf"] = 5] = "ButIf";
    TokenType[TokenType["By"] = 6] = "By";
    TokenType[TokenType["FunctionCall"] = 7] = "FunctionCall";
    TokenType[TokenType["Comma"] = 8] = "Comma";
    TokenType[TokenType["Decrease"] = 9] = "Decrease";
    TokenType[TokenType["Divide"] = 10] = "Divide";
    TokenType[TokenType["Do"] = 11] = "Do";
    TokenType[TokenType["EndOfFile"] = 12] = "EndOfFile";
    TokenType[TokenType["EndOfFor"] = 13] = "EndOfFor";
    TokenType[TokenType["EndOfFunction"] = 14] = "EndOfFunction";
    TokenType[TokenType["EndOfIf"] = 15] = "EndOfIf";
    TokenType[TokenType["EndOfWhile"] = 16] = "EndOfWhile";
    TokenType[TokenType["EqualTo"] = 17] = "EqualTo";
    TokenType[TokenType["For"] = 18] = "For";
    TokenType[TokenType["From"] = 19] = "From";
    TokenType[TokenType["FunctionDeclaration"] = 20] = "FunctionDeclaration";
    TokenType[TokenType["GreaterThan"] = 21] = "GreaterThan";
    TokenType[TokenType["GreaterThanOrEqualTo"] = 22] = "GreaterThanOrEqualTo";
    TokenType[TokenType["If"] = 23] = "If";
    TokenType[TokenType["Increase"] = 24] = "Increase";
    TokenType[TokenType["LessThan"] = 25] = "LessThan";
    TokenType[TokenType["LessThanOrEqualTo"] = 26] = "LessThanOrEqualTo";
    TokenType[TokenType["Minus"] = 27] = "Minus";
    TokenType[TokenType["Modulo"] = 28] = "Modulo";
    TokenType[TokenType["Multiply"] = 29] = "Multiply";
    TokenType[TokenType["Mutable"] = 30] = "Mutable";
    TokenType[TokenType["Not"] = 31] = "Not";
    TokenType[TokenType["NotEqualTo"] = 32] = "NotEqualTo";
    TokenType[TokenType["Or"] = 33] = "Or";
    TokenType[TokenType["Otherwise"] = 34] = "Otherwise";
    TokenType[TokenType["Print"] = 35] = "Print";
    TokenType[TokenType["Return"] = 36] = "Return";
    TokenType[TokenType["Set"] = 37] = "Set";
    TokenType[TokenType["ThatReturn"] = 38] = "ThatReturn";
    TokenType[TokenType["ThenPutResultInto"] = 39] = "ThenPutResultInto";
    TokenType[TokenType["To"] = 40] = "To";
    TokenType[TokenType["ToBe"] = 41] = "ToBe";
    TokenType[TokenType["VariableDeclaration"] = 42] = "VariableDeclaration";
    TokenType[TokenType["InitializedTo"] = 43] = "InitializedTo";
    TokenType[TokenType["VariableTypeBoolean"] = 44] = "VariableTypeBoolean";
    TokenType[TokenType["VariableTypeNumber"] = 45] = "VariableTypeNumber";
    TokenType[TokenType["VariableTypeString"] = 46] = "VariableTypeString";
    TokenType[TokenType["While"] = 47] = "While";
    TokenType[TokenType["WithParam"] = 48] = "WithParam";
    TokenType[TokenType["WithArg"] = 49] = "WithArg";
})(TokenType || (TokenType = {}));

var MATCHING_RULES = [
    { matcher: ',', tokenType: TokenType.Comma },
    { matcher: 'plus', tokenType: TokenType.Plus },
    { matcher: 'and', tokenType: TokenType.And },
    { matcher: 'as', tokenType: TokenType.As },
    { matcher: 'boolean', tokenType: TokenType.VariableTypeBoolean },
    { matcher: 'but if', tokenType: TokenType.ButIf },
    { matcher: 'by', tokenType: TokenType.By },
    { matcher: 'call function', tokenType: TokenType.FunctionCall },
    { matcher: 'decrease', tokenType: TokenType.Decrease },
    { matcher: 'define function', tokenType: TokenType.FunctionDeclaration },
    { matcher: 'define variable', tokenType: TokenType.VariableDeclaration },
    { matcher: 'divide', tokenType: TokenType.Divide },
    { matcher: 'do', tokenType: TokenType.Do },
    { matcher: 'end of for', tokenType: TokenType.EndOfFor },
    { matcher: 'end of function', tokenType: TokenType.EndOfFunction },
    { matcher: 'end of if', tokenType: TokenType.EndOfIf },
    { matcher: 'end of while', tokenType: TokenType.EndOfWhile },
    { matcher: 'equal to', tokenType: TokenType.EqualTo },
    { matcher: 'false', tokenType: TokenType.BooleanValueFalse },
    { matcher: 'for', tokenType: TokenType.For },
    { matcher: 'from', tokenType: TokenType.From },
    { matcher: 'greater than or equal to', tokenType: TokenType.GreaterThanOrEqualTo },
    { matcher: 'greater than', tokenType: TokenType.GreaterThan },
    { matcher: 'if', tokenType: TokenType.If },
    { matcher: 'increase', tokenType: TokenType.Increase },
    { matcher: 'initialized to', tokenType: TokenType.InitializedTo },
    { matcher: 'less than or equal to', tokenType: TokenType.LessThanOrEqualTo },
    { matcher: 'less than', tokenType: TokenType.LessThan },
    { matcher: 'minus', tokenType: TokenType.Minus },
    { matcher: 'modulo', tokenType: TokenType.Modulo },
    { matcher: 'multiply', tokenType: TokenType.Multiply },
    { matcher: 'mutable', tokenType: TokenType.Mutable },
    { matcher: 'not equal to', tokenType: TokenType.NotEqualTo },
    { matcher: 'not', tokenType: TokenType.Not },
    { matcher: 'number', tokenType: TokenType.VariableTypeNumber },
    { matcher: 'or', tokenType: TokenType.Or },
    { matcher: 'otherwise', tokenType: TokenType.Otherwise },
    { matcher: 'return', tokenType: TokenType.Return },
    { matcher: 'print', tokenType: TokenType.Print },
    { matcher: 'set', tokenType: TokenType.Set },
    { matcher: 'string', tokenType: TokenType.VariableTypeString },
    { matcher: 'that return', tokenType: TokenType.ThatReturn },
    { matcher: 'then put result into', tokenType: TokenType.ThenPutResultInto },
    { matcher: 'to', tokenType: TokenType.To },
    { matcher: 'to be', tokenType: TokenType.ToBe },
    { matcher: 'true', tokenType: TokenType.BooleanValueTrue },
    { matcher: 'while', tokenType: TokenType.While },
    { matcher: 'with param', tokenType: TokenType.WithParam },
    { matcher: 'with arg', tokenType: TokenType.WithArg }
];

var ExpectedTokenSet = (function () {
    function ExpectedTokenSet() {
        this.tokenStringSet = new Set();
    }
    ExpectedTokenSet.prototype.addExpectedToken = function (tokenString) {
        this.tokenStringSet.add(tokenString);
    };
    ExpectedTokenSet.prototype.clear = function () {
        this.tokenStringSet.clear();
    };
    ExpectedTokenSet.prototype.getExpectedTokenStringList = function () {
        var l = [];
        this.tokenStringSet.forEach(function (token) { return l.push(token); });
        l.sort();
        return l;
    };
    return ExpectedTokenSet;
}());
var TokenMatcherImpl = (function () {
    function TokenMatcherImpl(sourceCode, matchingRules) {
        if (matchingRules === void 0) { matchingRules = MATCHING_RULES; }
        this.sourceCode = sourceCode;
        this.matchingRules = matchingRules;
        this.rulesMap = new Map();
        this.position = 0;
        this.expectedErrorReportSet = new ExpectedTokenSet();
        for (var _i = 0, matchingRules_1 = matchingRules; _i < matchingRules_1.length; _i++) {
            var rule = matchingRules_1[_i];
            this.rulesMap.set(rule.tokenType, rule.matcher);
        }
        this.lineMapper = new LineMapper(sourceCode);
    }
    TokenMatcherImpl.prototype.makeError = function (position, message) {
        var lineCol = this.lineMapper.getLineAndCol(position);
        return new Error("L" + lineCol.line + ":C" + lineCol.col + "\n" + message);
    };
    TokenMatcherImpl.prototype.isEndOfFile = function (curPos) {
        if (curPos === void 0) { curPos = this.position; }
        return curPos >= this.sourceCode.length;
    };
    TokenMatcherImpl.prototype.getNextNonWhitespacePosition = function (curPos) {
        if (curPos === void 0) { curPos = this.position; }
        while (!this.isEndOfFile(curPos) && /\s/.test(this.sourceCode.charAt(curPos)) === true) {
            curPos++;
        }
        return curPos;
    };
    TokenMatcherImpl.prototype.getNextWhitespacePosition = function (curPos) {
        if (curPos === void 0) { curPos = this.position; }
        while (!this.isEndOfFile(curPos) && /\s/.test(this.sourceCode.charAt(curPos)) === false) {
            curPos++;
        }
        return curPos;
    };
    TokenMatcherImpl.prototype.checkForMatch = function (expectedMatcher) {
        var curPos = this.getNextNonWhitespacePosition(this.position);
        for (var i = 0; i < expectedMatcher.length; i++) {
            if (expectedMatcher.charAt(i) === ' ') {
                curPos = this.getNextNonWhitespacePosition(curPos + 1);
            }
            else {
                if (this.isEndOfFile(curPos) ||
                    this.sourceCode.charAt(curPos).toLowerCase() !== expectedMatcher.charAt(i)) {
                    return { isMatch: false };
                }
                else {
                    curPos++;
                }
            }
        }
        var newCurPos = this.getNextNonWhitespacePosition(curPos);
        if (newCurPos === curPos && !this.isEndOfFile(newCurPos)) {
            return { isMatch: false };
        }
        return { isMatch: true, newPosition: newCurPos };
    };
    TokenMatcherImpl.prototype.getNextTokenType = function (expectedTokens) {
        for (var _i = 0, expectedTokens_1 = expectedTokens; _i < expectedTokens_1.length; _i++) {
            var token = expectedTokens_1[_i];
            if (token === TokenType.EndOfFile) {
                var nextPos = this.getNextNonWhitespacePosition();
                if (this.isEndOfFile(nextPos)) {
                    this.expectedErrorReportSet.clear();
                    return {
                        token: token,
                        nextPosition: nextPos
                    };
                }
                else {
                    this.expectedErrorReportSet.addExpectedToken('(EOF)');
                }
            }
            else {
                var matcher = this.rulesMap.get(token);
                var matchResult = this.checkForMatch(matcher);
                if (matchResult.isMatch === true) {
                    this.expectedErrorReportSet.clear();
                    return {
                        token: token,
                        nextPosition: matchResult.newPosition
                    };
                }
                else {
                    this.expectedErrorReportSet.addExpectedToken(matcher);
                }
            }
        }
        var expectStr = this.expectedErrorReportSet.getExpectedTokenStringList().join(' | ');
        throw this.makeError(this.position, "Expected: " + expectStr + ".");
    };
    TokenMatcherImpl.prototype.peekNextTokenType = function (expectedTokens) {
        try {
            return this.getNextTokenType(expectedTokens).token;
        }
        catch (ex) {
            return false;
        }
    };
    TokenMatcherImpl.prototype.extractTokenType = function (expectedTokens) {
        var result = this.getNextTokenType(expectedTokens);
        this.position = result.nextPosition;
        return result.token;
    };
    TokenMatcherImpl.prototype.getNextTokenAsString = function () {
        this.expectedErrorReportSet.clear();
        var startPos = this.getNextNonWhitespacePosition();
        if (this.isEndOfFile(startPos)) {
            throw this.makeError(startPos, "Unexpected EOF.");
        }
        var endPos = this.getNextWhitespacePosition(startPos);
        var token = this.sourceCode.slice(startPos, endPos);
        for (var _i = 0, _a = this.matchingRules; _i < _a.length; _i++) {
            var rule = _a[_i];
            var tokenLowercase = token.toLowerCase();
            var matcher = rule.matcher;
            if (matcher === tokenLowercase || (matcher.substr(0, token.length) === tokenLowercase &&
                matcher.length > token.length &&
                matcher.charAt(token.length) === ' ')) {
                throw this.makeError(startPos, "Unexpected reserved word \"" + token + "\".");
            }
        }
        return {
            token: token,
            nextPosition: endPos
        };
    };
    TokenMatcherImpl.prototype.extractNextTokenAsString = function () {
        var result = this.getNextTokenAsString();
        this.position = result.nextPosition;
        return result.token;
    };
    TokenMatcherImpl.prototype.peekNextTokenAsString = function () {
        try {
            return this.getNextTokenAsString().token;
        }
        catch (ex) {
            return false;
        }
    };
    TokenMatcherImpl.prototype.extractStringLiteralIfAny = function () {
        this.expectedErrorReportSet.clear();
        var startPos = this.getNextNonWhitespacePosition();
        if (this.isEndOfFile(startPos)) {
            return false;
        }
        var stringQuoteCharacter = this.sourceCode.charAt(startPos);
        if (stringQuoteCharacter !== '\'' &&
            stringQuoteCharacter !== '"' &&
            stringQuoteCharacter !== '`') {
            return false;
        }
        var curPos = startPos;
        while (true) {
            curPos++;
            if (this.isEndOfFile(curPos)) {
                return false;
            }
            var curChar = this.sourceCode.charAt(curPos);
            if (curChar === stringQuoteCharacter) {
                this.position = curPos + 1;
                return this.sourceCode.slice(startPos + 1, curPos);
            }
        }
    };
    return TokenMatcherImpl;
}());

var VariableType;
(function (VariableType) {
    VariableType[VariableType["Number"] = 0] = "Number";
    VariableType[VariableType["String"] = 1] = "String";
    VariableType[VariableType["Boolean"] = 2] = "Boolean";
})(VariableType || (VariableType = {}));

var STATEMENT_FIRST_SET = [
    TokenType.VariableDeclaration,
    TokenType.Set,
    TokenType.Increase,
    TokenType.Decrease,
    TokenType.Print,
    TokenType.If,
    TokenType.While,
    TokenType.For,
    TokenType.FunctionCall,
    TokenType.Return
];
var PROGRAM_FIRST_SET = STATEMENT_FIRST_SET.concat([TokenType.FunctionDeclaration, TokenType.EndOfFile]);
var VARIABLE_TYPE_FIRST_SET = [
    TokenType.VariableTypeNumber,
    TokenType.VariableTypeString,
    TokenType.VariableTypeBoolean
];
var BOOLEAN_VALUE_FIRST_SET = [
    TokenType.BooleanValueTrue,
    TokenType.BooleanValueFalse
];
var OPERATOR_WITH_TWO_OPERANDS_FIRST_SET = [
    TokenType.Plus,
    TokenType.And,
    TokenType.Divide,
    TokenType.EqualTo,
    TokenType.GreaterThanOrEqualTo,
    TokenType.GreaterThan,
    TokenType.LessThanOrEqualTo,
    TokenType.LessThan,
    TokenType.Minus,
    TokenType.Modulo,
    TokenType.Multiply,
    TokenType.NotEqualTo,
    TokenType.Or,
];
var VARIABLE_NAME_REG_EXP = /^[a-zA-Z][a-zA-Z0-9-_]*$/;
var Parser = (function () {
    function Parser(tokenizer) {
        this.tokenizer = tokenizer;
    }
    Parser.parseSourceCode = function (sourceCode) {
        var tokenMatcher = new TokenMatcherImpl(sourceCode);
        var parser = new Parser(tokenMatcher);
        return parser.parse();
    };
    Parser.prototype.createErrorInvalidToken = function (token, cause) {
        if (cause === void 0) { cause = ''; }
        return new Error(("Invalid token " + TokenType[token] + ". " + cause).trim());
    };
    Parser.prototype.parse = function () {
        var programAST = { instructions: [] };
        while (true) {
            var token = this.tokenizer.extractTokenType(PROGRAM_FIRST_SET);
            if (token === TokenType.FunctionDeclaration) {
                programAST.instructions.push(this.createFunction());
            }
            else if (token === TokenType.EndOfFile) {
                break;
            }
            else {
                programAST.instructions.push(this.createStatement(token));
            }
        }
        return programAST;
    };
    Parser.prototype.createFunction = function () {
        var functionName = this.tokenizer.extractNextTokenAsString();
        var parameters = [];
        if (this.tokenizer.peekNextTokenType([TokenType.WithParam]) !== false) {
            this.tokenizer.extractTokenType([TokenType.WithParam]);
            while (true) {
                var name_1 = this.tokenizer.extractNextTokenAsString();
                this.tokenizer.extractTokenType([TokenType.As]);
                var typeInfo = this.createVariableTypeInfoIfAny();
                if (typeInfo === undefined) {
                    throw new Error("Parameter \"" + name_1 + "\" of function \"" + functionName + "\" requires a valid type.");
                }
                parameters.push({ name: name_1, typeInfo: typeInfo });
                if (this.tokenizer.peekNextTokenType([TokenType.Comma]) !== false) {
                    this.tokenizer.extractTokenType([TokenType.Comma]);
                }
                else {
                    break;
                }
            }
        }
        var returnType = undefined;
        if (this.tokenizer.peekNextTokenType([TokenType.ThatReturn]) !== false) {
            this.tokenizer.extractTokenType([TokenType.ThatReturn]);
            returnType = this.createVariableType();
        }
        this.tokenizer.extractTokenType([TokenType.Do]);
        var statements = this.createStatements();
        this.tokenizer.extractTokenType([TokenType.EndOfFunction]);
        return {
            type: 'Function',
            functionName: functionName,
            parameters: parameters,
            returnType: returnType,
            statements: statements
        };
    };
    Parser.prototype.createExpressionAtom = function () {
        // Check for boolean
        var boolToken = this.tokenizer.peekNextTokenType(BOOLEAN_VALUE_FIRST_SET);
        if (boolToken !== false) {
            this.tokenizer.extractTokenType(BOOLEAN_VALUE_FIRST_SET);
            var atom = {
                type: 'ExpressionAtom',
                atomType: 'Boolean',
                value: boolToken === TokenType.BooleanValueTrue
            };
            return atom;
        }
        // Check for string
        var tokenStr = this.tokenizer.extractStringLiteralIfAny();
        if (tokenStr !== false) {
            var atom = {
                type: 'ExpressionAtom',
                atomType: 'String',
                value: tokenStr
            };
            return atom;
        }
        var token = this.tokenizer.extractNextTokenAsString();
        // Check for number
        if (/^-?([0-9]*\.[0-9]+|[0-9]+)$/.test(token)) {
            var atom = {
                type: 'ExpressionAtom',
                atomType: 'Number',
                value: token
            };
            return atom;
        }
        // Check for variable name
        if (VARIABLE_NAME_REG_EXP.test(token)) {
            var atom = {
                type: 'ExpressionAtom',
                atomType: 'Variable',
                variableName: token
            };
            return atom;
        }
        throw new Error('Invalid expression.');
    };
    Parser.prototype.createExpression = function () {
        // One Operands
        var nextToken1 = this.tokenizer.peekNextTokenType([TokenType.Not]);
        if (nextToken1 !== false) {
            this.tokenizer.extractTokenType([TokenType.Not]);
            var notExpression = {
                type: 'Expression',
                operator: ExpressionOperator.Not,
                rightValue: this.createExpression()
            };
            return notExpression;
        }
        var atom = this.createExpressionAtom();
        var nextToken2 = this.tokenizer.peekNextTokenType(OPERATOR_WITH_TWO_OPERANDS_FIRST_SET);
        if (nextToken2 !== false) {
            // Two Operands
            var operator = void 0;
            switch (nextToken2) {
                case TokenType.Plus:
                    operator = ExpressionOperator.Plus;
                    break;
                case TokenType.And:
                    operator = ExpressionOperator.And;
                    break;
                case TokenType.Divide:
                    operator = ExpressionOperator.Divide;
                    break;
                case TokenType.EqualTo:
                    operator = ExpressionOperator.EqualTo;
                    break;
                case TokenType.GreaterThan:
                    operator = ExpressionOperator.GreaterThan;
                    break;
                case TokenType.GreaterThanOrEqualTo:
                    operator = ExpressionOperator.GreaterThanOrEqualTo;
                    break;
                case TokenType.LessThan:
                    operator = ExpressionOperator.LessThan;
                    break;
                case TokenType.LessThanOrEqualTo:
                    operator = ExpressionOperator.LessThanOrEqualTo;
                    break;
                case TokenType.Minus:
                    operator = ExpressionOperator.Minus;
                    break;
                case TokenType.Modulo:
                    operator = ExpressionOperator.Modulo;
                    break;
                case TokenType.Multiply:
                    operator = ExpressionOperator.Multiply;
                    break;
                case TokenType.NotEqualTo:
                    operator = ExpressionOperator.NotEqualTo;
                    break;
                case TokenType.Or:
                    operator = ExpressionOperator.Or;
                    break;
                default: throw this.createErrorInvalidToken(nextToken2);
            }
            this.tokenizer.extractTokenType(OPERATOR_WITH_TWO_OPERANDS_FIRST_SET);
            var expression = {
                type: 'Expression',
                leftValue: atom,
                operator: operator,
                rightValue: this.createExpression()
            };
            return expression;
        }
        else {
            // No Operand
            return atom;
        }
    };
    Parser.prototype.createVariableType = function () {
        var token = this.tokenizer.extractTokenType(VARIABLE_TYPE_FIRST_SET);
        var variableType;
        if (token === TokenType.VariableTypeNumber) {
            variableType = VariableType.Number;
        }
        else if (token === TokenType.VariableTypeString) {
            variableType = VariableType.String;
        }
        else if (token === TokenType.VariableTypeBoolean) {
            variableType = VariableType.Boolean;
        }
        else {
            throw this.createErrorInvalidToken(token);
        }
        return variableType;
    };
    Parser.prototype.createVariableTypeInfoIfAny = function () {
        if (this.tokenizer.peekNextTokenType([TokenType.Mutable])) {
            this.tokenizer.extractTokenType([TokenType.Mutable]);
            return {
                isMutable: true,
                variableType: this.createVariableType()
            };
        }
        else {
            try {
                var variableType = this.createVariableType();
                return {
                    isMutable: false,
                    variableType: variableType
                };
            }
            catch (e) {
                return undefined;
            }
        }
    };
    Parser.prototype.createVariableDeclaration = function () {
        var variableName = this.tokenizer.extractNextTokenAsString();
        this.tokenizer.extractTokenType([TokenType.ToBe]);
        var variableTypeInfo = this.createVariableTypeInfoIfAny();
        var initialValue = undefined;
        var initFirstSet = [TokenType.EqualTo, TokenType.InitializedTo];
        if (this.tokenizer.peekNextTokenType(initFirstSet) !== false) {
            this.tokenizer.extractTokenType(initFirstSet);
            initialValue = this.createExpression();
        }
        if (variableTypeInfo === undefined && initialValue === undefined) {
            throw new Error('Variable declaration must either have a type or initial value.');
        }
        return {
            type: 'VariableDeclaration',
            variableName: variableName,
            variableTypeInfo: variableTypeInfo,
            initialValue: initialValue
        };
    };
    Parser.prototype.createAssignment = function (type) {
        var variableName = this.tokenizer.extractNextTokenAsString();
        if (type === TokenType.Set) {
            this.tokenizer.extractTokenType([TokenType.ToBe]);
        }
        else {
            this.tokenizer.extractTokenType([TokenType.By]);
        }
        var expression = this.createExpression();
        switch (type) {
            case TokenType.Set: {
                var assignment = {
                    type: 'AssignmentSet',
                    variableName: variableName,
                    value: expression
                };
                return assignment;
            }
            case TokenType.Increase: {
                var assignment = {
                    type: 'AssignmentIncrease',
                    variableName: variableName,
                    value: expression
                };
                return assignment;
            }
            case TokenType.Decrease: {
                var assignment = {
                    type: 'AssignmentDecrease',
                    variableName: variableName,
                    value: expression
                };
                return assignment;
            }
        }
        throw this.createErrorInvalidToken(type);
    };
    Parser.prototype.createPrintStatement = function () {
        return {
            type: 'PrintStatement',
            value: this.createExpression()
        };
    };
    Parser.prototype.createWhileLoop = function () {
        var condition = this.createExpression();
        this.tokenizer.extractTokenType([TokenType.Do]);
        var statements = this.createStatements();
        this.tokenizer.extractTokenType([TokenType.EndOfWhile]);
        return {
            type: 'WhileBlock',
            condition: condition,
            statements: statements
        };
    };
    Parser.prototype.createForLoop = function () {
        var iteratorName = this.tokenizer.extractNextTokenAsString();
        this.tokenizer.extractTokenType([TokenType.From]);
        var from = this.createExpression();
        this.tokenizer.extractTokenType([TokenType.To]);
        var to = this.createExpression();
        this.tokenizer.extractTokenType([TokenType.Do]);
        var statements = this.createStatements();
        this.tokenizer.extractTokenType([TokenType.EndOfFor]);
        return {
            type: 'ForBlock',
            iteratorName: iteratorName,
            iteratorFrom: from,
            iteratorTo: to,
            statements: statements
        };
    };
    Parser.prototype.createIfBlock = function () {
        var firstCondition = this.createExpression();
        this.tokenizer.extractTokenType([TokenType.Do]);
        var firstStatements = this.createStatements();
        var ifBlocks = [{
                condition: firstCondition,
                statements: firstStatements
            }];
        var elseBlockStatement = undefined;
        while (true) {
            var token = this.tokenizer.peekNextTokenType([TokenType.ButIf, TokenType.Otherwise]);
            if (token === TokenType.ButIf) {
                this.tokenizer.extractTokenType([TokenType.ButIf]);
                var condition = this.createExpression();
                this.tokenizer.extractTokenType([TokenType.Do]);
                var statements = this.createStatements();
                ifBlocks.push({ condition: condition, statements: statements });
            }
            else if (token === TokenType.Otherwise) {
                this.tokenizer.extractTokenType([TokenType.Otherwise]);
                this.tokenizer.extractTokenType([TokenType.Do]);
                elseBlockStatement = this.createStatements();
                break;
            }
            else {
                break;
            }
        }
        this.tokenizer.extractTokenType([TokenType.EndOfIf]);
        return {
            type: 'IfBlock',
            ifBlocks: ifBlocks,
            elseBlockStatements: elseBlockStatement
        };
    };
    Parser.prototype.createFunctionCall = function () {
        var functionName = this.tokenizer.extractNextTokenAsString();
        var args = [];
        if (this.tokenizer.peekNextTokenType([TokenType.WithArg]) !== false) {
            this.tokenizer.extractTokenType([TokenType.WithArg]);
            while (true) {
                args.push(this.createExpression());
                if (this.tokenizer.peekNextTokenType([TokenType.Comma]) !== false) {
                    this.tokenizer.extractTokenType([TokenType.Comma]);
                }
                else {
                    break;
                }
            }
        }
        var targetVariableName = undefined;
        if (this.tokenizer.peekNextTokenType([TokenType.ThenPutResultInto]) !== false) {
            this.tokenizer.extractTokenType([TokenType.ThenPutResultInto]);
            targetVariableName = this.tokenizer.extractNextTokenAsString();
        }
        return {
            type: 'FunctionCall',
            functionName: functionName,
            callArguments: args,
            resultTarget: targetVariableName
        };
    };
    Parser.prototype.createReturnStatement = function () {
        return {
            type: 'FunctionReturn',
            returnValue: this.createExpression()
        };
    };
    Parser.prototype.createStatements = function () {
        var statements = [];
        while (true) {
            var statementType = this.tokenizer.peekNextTokenType(STATEMENT_FIRST_SET);
            if (statementType !== false) {
                statements.push(this.createStatement(this.tokenizer.extractTokenType(STATEMENT_FIRST_SET)));
            }
            else {
                break;
            }
        }
        return statements;
    };
    Parser.prototype.createStatement = function (statementType) {
        switch (statementType) {
            case TokenType.VariableDeclaration:
                return this.createVariableDeclaration();
            case TokenType.Set:
            case TokenType.Increase:
            case TokenType.Decrease:
                return this.createAssignment(statementType);
            case TokenType.Print:
                return this.createPrintStatement();
            case TokenType.If:
                return this.createIfBlock();
            case TokenType.While:
                return this.createWhileLoop();
            case TokenType.For:
                return this.createForLoop();
            case TokenType.FunctionCall:
                return this.createFunctionCall();
            case TokenType.Return:
                return this.createReturnStatement();
        }
        throw this.createErrorInvalidToken(statementType);
    };
    return Parser;
}());

function compile(sourceCode, language) {
    var ast = Parser.parseSourceCode(sourceCode);
    var codeGenerator;
    switch (language) {
        case 'js':
            codeGenerator = new ECMAScriptCodeGenerator(ast);
            break;
        default:
            throw new Error("Language \"" + language + "\" is not supported.");
    }
    return codeGenerator.generateCode();
}

exports.compile = compile;
exports.Parser = Parser;
exports.ECMAScriptCodeGenerator = ECMAScriptCodeGenerator;

Object.defineProperty(exports, '__esModule', { value: true });

})));
