
class LineInfo {
    constructor({
        start_index = null,
        end_index =null
    }) {
        this.start_index = new Number(start_index);
        this.end_index = !isNaN(end_index) ? new Number(end_index): null;
    }
}

module.exports = LineInfo