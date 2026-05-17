//implement min heap 
export class MinHeap {
    arr: number[] = [];

    constructor(arr: number[]) {
        this.arr = arr;
    }

    heapifyup() {
        let i = this.arr.length - 1;
        while (i > 0) {
            let p = Math.abs(Math.floor((i - 1 / 2)));
            if (this.arr[i]! < this.arr[p]!) {
                let temp = this.arr[p];
                this.arr[p]! = this.arr[i]!;
                this.arr[i]! = temp;
            }
            i = p;
        }
    }
    size(){
        return this.arr.length;
    }
    insert(x: number) {
        this.arr.push(x);
        this.heapifyup();
    }

    heapifydown() {
        let sz = this.arr.length;
        let i = 0;
        while (i < sz - 1) {
            let rc = (i * 2) + 2; let lc = (i * 2) + 1;
            let min = 0;
            if (lc >= sz && rc >= sz) break;
            if (lc < sz) min = lc;
            if (rc < sz && this.arr[rc]! < this.arr[min]!) min = rc;
            if (this.arr[i]! <= this.arr[min]!) break;
            
            let temp = this.arr[min]!;
            this.arr[min]! = this.arr[i]!;
            this.arr[i]! = temp;
            i = min;
        }
    }

    getmin() {
        if (this.arr.length == 0) return null;
        return this.arr[0];
    }

    removemin() {
        if (this.arr.length == 0) console.log("empty");
        else {
            let sz = this.arr.length;
            let f = this.arr[0]!;
            let lst = this.arr[sz - 1]!;
            this.arr[sz - 1] = f;
            this.arr[0] = lst;
            //removing the max element
            this.arr.pop();
            this.heapifydown();
            console.log(this.arr);
        }
        return;
    }
}