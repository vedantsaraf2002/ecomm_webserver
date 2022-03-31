// base = Product.find()

class WhereClause{
    constructor(base, bigQ){
        this.base = base;
        this.bigQ = bigQ;
    }
    search(){
        const searchword = this.bigQ.search ? {
            name: {
                $regex: this.bigQ.search,
                $options: 'i' // i for the case insestivity
            }
        } : {}

        this.base = this.base.find({
            ...searchword
        })
        return this;
    }
    pager(resultperPage){
        let currentPage = 1;
        if(this.bigQ.page){
            currentPage = this.bigQ.page
        }

        const skipVal = resultperPage * (currentPage - 1);

        this.base = this.base.limit(resultperPage).skip(skipVal)
        return this;7
    }
    filter(){
        const copyQ = {...this.bigQ}

        delete copyQ["search"];
        delete copyQ["page"];
        delete copyQ["limit"];

        //covert bigQ into a string => copyQ
        let stringOfCopyQ = JSON.stringify(copyQ)

        stringOfCopyQ = stringOfCopyQ.replace(/\b(gte | lte | gt | lt )\b/g, m => `$${m}`);
        const jsonOfCopyQ = JSON.parse(stringOfCopyQ);
        this.base = this.base.find(jsonOfCopyQ);
    }
}
module.exports = WhereClause;