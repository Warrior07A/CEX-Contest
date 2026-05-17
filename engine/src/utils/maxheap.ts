//implement max heap 
export class MaxHeap {
    arr: number[] = [];

    constructor(arr: number[]) {
        this.arr = arr;
    }

    heapifyup() {
        let i = this.arr.length - 1;
        while (i > 0) {
            let p = Math.abs(Math.floor((i - 1 / 2)));
            if (this.arr[i]! > this.arr[p]!) {
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
            // console.log("hi");
            let rc = (i * 2) + 2; let lc = (i * 2) + 1;
            let mx = 0;
            if (lc >= sz && rc >= sz) break;
            if (lc < sz) mx = lc;
            if (rc < sz && this.arr[rc]! < this.arr[mx]!) mx = rc;
            console.log(this.arr[i]);
            // console.log(this.arr[mx]);
            if (this.arr[i]! > this.arr[mx]!) break;
            // console.log(i , " " , mx );
            
            let temp = this.arr[mx]!;
            this.arr[mx]! = this.arr[i]!;
            this.arr[i]! = temp;
            i = mx;
            
        }
    }

    getmax() {
        if (this.arr.length == 0) return null;
        else return this.arr[0];
    }

    removemax() {
        if (this.arr.length == 0) console.log("empty");
        else {
            let sz = this.arr.length;
            let f = this.arr[0];
            let lst = this.arr[sz - 1];
            this.arr[sz - 1]! = f;
            this.arr[0]! = lst;
            //removing the max element
            this.arr.pop();
            this.heapifydown();
            // console.log(this.arr);
        }
    }
}
let h = new MaxHeap([]);
h.insert(1);
h.insert(2);




// function heapifyup() {
//     let i = maxheap.length - 1;
//     while (i > 0) {
//         let p = Math.abs(Math.floor((i - 1 / 2)));
//         if (maxheap[i] > maxheap[p]) {
//             let temp = maxheap[p];
//             maxheap[p] = maxheap[i];
//             maxheap[i] = temp;
//         }
//         i = p;
//     }
// }
// function heapifydown(){
//     let sz = maxheap.length;
//     let i = 0;
//     while(i < sz - 1){
//         let rc = (i * 2) + 2; let lc = (i * 2) + 1;
//         let mx = 0;
//         if (lc < sz) mx = lc;   
//         if(rc < sz && maxheap[rc] < mx) mx = rc;
//         if (maxheap[i] > mx) break;
//         let temp = maxheap[mx];
//         maxheap[mx] = maxheap[i];
//         maxheap[i] = temp;
//         i = mx;
//     }
// }
// function getmax(){
//     if (maxheap.length == 0) console.log("empty");
//     else console.log(maxheap[0]);
// }
// function heapinsert(x : number){
//     maxheap.push(x);
//     heapifyup();
// }
// function removemax(){
//     if (maxheap.length == 0) console.log("empty");
//     else {
//         let sz = maxheap.length;
//         let f = maxheap[0];
//         let lst = maxheap[sz - 1];
//         maxheap[sz - 1] = f ;
//         maxheap[0] = lst;
//         maxheap.pop();
//         heapifydown();
//         console.log(maxheap);
//     }
// }
