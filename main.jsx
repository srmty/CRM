import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TrashIcon, PlusIcon, MinusIcon, PackageIcon, Users2Icon, HistoryIcon, PercentIcon } from "lucide-react";

const initialItems = [
  { id: 1, name: "Item A", price: 100, quantity: 10, taxRate: 10 },
  { id: 2, name: "Item B", price: 200, quantity: 5, taxRate: 5 },
  { id: 3, name: "Item C", price: 150, quantity: 8, taxRate: 8 },
];

const initialCustomers = [
  { id: 1, name: "John Doe", phone: "555-1234", creditLimit: 1000, creditUsed: 200 },
  { id: 2, name: "Jane Smith", phone: "555-5678", creditLimit: 2000, creditUsed: 500 },
];

const initialTransactions = [
  { id: 1, customerId: 1, items: [{ id: 1, name: "Item A", price: 100, quantity: 2, taxRate: 10 }], total: 220, tax: 20, paymentMode: "paid", date: "2025-03-28" },
  { id: 2, customerId: 2, items: [{ id: 2, name: "Item B", price: 200, quantity: 1, taxRate: 5 }], total: 210, tax: 10, paymentMode: "credit", date: "2025-03-29" },
  { id: 3, customerId: 1, items: [{ id: 3, name: "Item C", price: 150, quantity: 3, taxRate: 8 }], total: 486, tax: 36, paymentMode: "credit", date: "2025-03-30" },
];

export default function BillingDashboard() {
  const [items, setItems] = useState(initialItems);
  const [cart, setCart] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", price: "", quantity: "", taxRate: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState(initialCustomers);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", creditLimit: "" });
  const [paymentMode, setPaymentMode] = useState("paid");
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);

  // Add to cart with error handling and stock management
  const addToCart = (item, qty) => {
    const quantity = parseInt(qty);
    
    if (isNaN(quantity) || quantity < 1) {
      alert("Please enter a valid quantity!");
      return;
    }
    
    if (quantity > item.quantity) {
      alert("Not enough stock available!");
      return;
    }
    
    // Update items stock
    setItems(items.map(i => 
      i.id === item.id ? { ...i, quantity: i.quantity - quantity } : i
    ));
    
    // Update cart
    const existingItem = cart.find((c) => c.id === item.id);
    if (existingItem) {
      setCart(
        cart.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + quantity } : c
        )
      );
    } else {
      setCart([...cart, { ...item, quantity }]);
    }
  };

  // Remove item from cart
  const removeFromCart = (itemId) => {
    const itemToRemove = cart.find(item => item.id === itemId);
    
    // Return quantity to stock
    setItems(items.map(item => 
      item.id === itemId 
        ? { ...item, quantity: item.quantity + itemToRemove.quantity } 
        : item
    ));
    
    // Remove from cart
    setCart(cart.filter(item => item.id !== itemId));
  };

  // Adjust quantity in cart
  const adjustQuantity = (itemId, amount) => {
    const itemInCart = cart.find(item => item.id === itemId);
    const itemInStock = items.find(item => item.id === itemId);
    
    if (amount > 0 && itemInStock.quantity < 1) {
      alert("No more stock available!");
      return;
    }
    
    if (itemInCart.quantity + amount < 1) {
      removeFromCart(itemId);
      return;
    }
    
    // Update stock
    setItems(items.map(item => 
      item.id === itemId 
        ? { ...item, quantity: item.quantity - amount } 
        : item
    ));
    
    // Update cart quantity
    setCart(cart.map(item => 
      item.id === itemId 
        ? { ...item, quantity: item.quantity + amount } 
        : item
    ));
  };

  // Add new inventory item
  const handleAddNewItem = () => {
    if (!newItem.name || !newItem.price || !newItem.quantity || !newItem.taxRate) {
      alert("Please fill all fields");
      return;
    }
    
    const newItemWithId = {
      ...newItem,
      id: Math.max(...items.map(item => item.id), 0) + 1,
      price: parseFloat(newItem.price),
      quantity: parseInt(newItem.quantity),
      taxRate: parseFloat(newItem.taxRate)
    };
    
    setItems([...items, newItemWithId]);
    setNewItem({ name: "", price: "", quantity: "", taxRate: "" });
    setAddItemDialogOpen(false);
  };

  // Add new customer
  const handleAddNewCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone || !newCustomer.creditLimit) {
      alert("Please fill all customer fields");
      return;
    }
    
    const newCustomerWithId = {
      ...newCustomer,
      id: Math.max(...customers.map(customer => customer.id), 0) + 1,
      creditLimit: parseFloat(newCustomer.creditLimit),
      creditUsed: 0
    };
    
    setCustomers([...customers, newCustomerWithId]);
    setNewCustomer({ name: "", phone: "", creditLimit: "" });
  };

  // Calculate subtotal before tax
  const calculateSubtotal = () => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  };

  // Calculate tax
  const calculateTax = () => {
    return cart.reduce((acc, item) => {
      const itemTax = (item.price * item.quantity) * (item.taxRate / 100);
      return acc + itemTax;
    }, 0);
  };

  // Calculate total with tax
  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  // Complete purchase
  const completePurchase = () => {
    if (!selectedCustomer) {
      alert("Please select a customer before completing purchase");
      return;
    }
    
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }
    
    const total = calculateTotal();
    
    // For credit payment, check credit limit
    if (paymentMode === "credit") {
      const newCreditUsed = selectedCustomer.creditUsed + total;
      if (newCreditUsed > selectedCustomer.creditLimit) {
        alert("This purchase exceeds the customer's credit limit");
        return;
      }
      
      // Update customer's credit used
      setCustomers(customers.map(customer => 
        customer.id === selectedCustomer.id 
          ? { ...customer, creditUsed: newCreditUsed } 
          : customer
      ));
    }
    
    // Create new transaction
    const newTransaction = {
      id: Math.max(...transactions.map(transaction => transaction.id), 0) + 1,
      customerId: selectedCustomer.id,
      items: [...cart],
      total: total,
      tax: calculateTax(),
      paymentMode: paymentMode,
      date: new Date().toISOString().split('T')[0]
    };
    
    setTransactions([...transactions, newTransaction]);
    
    // Reset cart
    setCart([]);
    alert(`Purchase completed! Total: $${total.toFixed(2)}`);
  };

  // Filter items based on search
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter transactions based on payment mode
  const filterTransactionsByPaymentMode = (mode) => {
    return transactions.filter(transaction => transaction.paymentMode === mode);
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Billing Dashboard</h1>
        <p className="text-gray-500">Manage your inventory, customer orders, and credit accounts</p>
      </header>
      
      <Tabs defaultValue="billing">
        <TabsList className="mb-4">
          <TabsTrigger value="billing"><PackageIcon className="h-4 w-4 mr-2" />Billing</TabsTrigger>
          <TabsTrigger value="customers"><Users2Icon className="h-4 w-4 mr-2" />Customers</TabsTrigger>
          <TabsTrigger value="history"><HistoryIcon className="h-4 w-4 mr-2" />Transaction History</TabsTrigger>
        </TabsList>
        
        {/* Billing Tab */}
        <TabsContent value="billing">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inventory Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Inventory</CardTitle>
                  <CardDescription>Available items for sale</CardDescription>
                </div>
                <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">Add New Item</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Inventory Item</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 mt-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Item Name</label>
                        <Input
                          placeholder="Item name"
                          value={newItem.name}
                          onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Price ($)</label>
                        <Input
                          type="number"
                          placeholder="Price"
                          value={newItem.price}
                          onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Quantity</label>
                        <Input
                          type="number"
                          placeholder="Quantity"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tax Rate (%)</label>
                        <Input
                          type="number"
                          placeholder="Tax Rate"
                          value={newItem.taxRate}
                          onChange={(e) => setNewItem({...newItem, taxRate: e.target.value})}
                        />
                      </div>
                      <Button onClick={handleAddNewItem} className="w-full">Add to Inventory</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input 
                    placeholder="Search items..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="overflow-x-auto">
                  {/* Custom table implementation */}
                  <div className="w-full border rounded-md">
                    {/* Table Header */}
                    <div className="grid grid-cols-6 bg-gray-100 p-3 font-medium border-b">
                      <div>Name</div>
                      <div>Price</div>
                      <div>Tax</div>
                      <div>Stock</div>
                      <div>Quantity</div>
                      <div>Action</div>
                    </div>
                    
                    {/* Table Body */}
                    <div className="divide-y">
                      {filteredItems.map((item) => (
                        <div key={item.id} className="grid grid-cols-6 p-3 items-center">
                          <div>{item.name}</div>
                          <div>${item.price.toFixed(2)}</div>
                          <div>{item.taxRate}%</div>
                          <div>
                            <Badge variant={item.quantity > 3 ? "default" : "destructive"}>
                              {item.quantity}
                            </Badge>
                          </div>
                          <div>
                            <Input
                              type="number"
                              min="1"
                              max={item.quantity}
                              defaultValue={1}
                              id={`qty-${item.id}`}
                              className="w-16"
                            />
                          </div>
                          <div>
                            <Button
                              size="sm"
                              disabled={item.quantity < 1}
                              onClick={() => {
                                const qty = document.getElementById(`qty-${item.id}`).value;
                                addToCart(item, qty);
                              }}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Cart Section */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Cart</CardTitle>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <Select value={selectedCustomer ? selectedCustomer.id.toString() : ""}
                    onValueChange={(value) => {
                      const customer = customers.find(c => c.id === parseInt(value));
                      setSelectedCustomer(customer);
                    }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={paymentMode} onValueChange={setPaymentMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Payment mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {selectedCustomer && paymentMode === "credit" && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-md">
                    <div className="flex justify-between">
                      <span>Credit Limit:</span>
                      <span>${selectedCustomer.creditLimit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Credit Used:</span>
                      <span>${selectedCustomer.creditUsed.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Available Credit:</span>
                      <span>${(selectedCustomer.creditLimit - selectedCustomer.creditUsed).toFixed(2)}</span>
                    </div>
                  </div>
                )}
                
                {cart.length > 0 ? (
                  <div className="overflow-x-auto">
                    {/* Custom cart table */}
                    <div className="w-full border rounded-md">
                      {/* Table Header */}
                      <div className="grid grid-cols-6 bg-gray-100 p-3 font-medium border-b">
                        <div>Item</div>
                        <div>Price</div>
                        <div>Tax</div>
                        <div>Qty</div>
                        <div>Subtotal</div>
                        <div>Actions</div>
                      </div>
                      
                      {/* Table Body */}
                      <div className="divide-y">
                        {cart.map((item) => (
                          <div key={item.id} className="grid grid-cols-6 p-3 items-center">
                            <div>{item.name}</div>
                            <div>${item.price.toFixed(2)}</div>
                            <div>{item.taxRate}%</div>
                            <div>
                              <div className="flex items-center">
                                <Button 
                                  size="icon" 
                                  variant="outline" 
                                  className="h-6 w-6" 
                                  onClick={() => adjustQuantity(item.id, -1)}
                                >
                                  <MinusIcon className="h-3 w-3" />
                                </Button>
                                <span className="mx-2">{item.quantity}</span>
                                <Button 
                                  size="icon" 
                                  variant="outline" 
                                  className="h-6 w-6" 
                                  onClick={() => adjustQuantity(item.id, 1)}
                                  disabled={items.find(i => i.id === item.id).quantity < 1}
                                >
                                  <PlusIcon className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div>${(item.price * item.quantity).toFixed(2)}</div>
                            <div>
                              <Button 
                                variant="destructive" 
                                size="icon" 
                                className="h-7 w-7" 
                                onClick={() => removeFromCart(item.id)}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Cart is empty. Add items from inventory.
                  </div>
                )}
                
                {cart.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div className="space-y-2 p-4 bg-gray-50 rounded-md">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${calculateSubtotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center">
                          <PercentIcon className="h-4 w-4 mr-1" />Tax:
                        </span>
                        <span>${calculateTax().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t font-bold">
                        <span>Total:</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={completePurchase} 
                      disabled={!selectedCustomer || cart.length === 0}
                    >
                      {paymentMode === "paid" ? "Complete Paid Purchase" : "Complete on Credit"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Customers Tab */}
        <TabsContent value="customers">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer List */}
            <Card>
              <CardHeader>
                <CardTitle>Customer List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="w-full border rounded-md">
                    <div className="grid grid-cols-4 bg-gray-100 p-3 font-medium border-b">
                      <div>Name</div>
                      <div>Phone</div>
                      <div>Credit Limit</div>
                      <div>Credit Used</div>
                    </div>
                    
                    <div className="divide-y">
                      {customers.map((customer) => (
                        <div key={customer.id} className="grid grid-cols-4 p-3 items-center">
                          <div>{customer.name}</div>
                          <div>{customer.phone}</div>
                          <div>${customer.creditLimit.toFixed(2)}</div>
                          <div>${customer.creditUsed.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Add New Customer */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Customer Name</label>
                    <Input
                      placeholder="Customer name"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Phone Number</label>
                    <Input
                      placeholder="Phone number"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Credit Limit ($)</label>
                    <Input
                      type="number"
                      placeholder="Credit limit"
                      value={newCustomer.creditLimit}
                      onChange={(e) => setNewCustomer({...newCustomer, creditLimit: e.target.value})}
                    />
                  </div>
                  <Button onClick={handleAddNewCustomer} className="w-full">Add Customer</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Transaction History Tab */}
        <TabsContent value="history">
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Transactions</TabsTrigger>
              <TabsTrigger value="paid">Paid Transactions</TabsTrigger>
              <TabsTrigger value="credit">Credit Transactions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <div className="w-full border rounded-md">
                      <div className="grid grid-cols-5 bg-gray-100 p-3 font-medium border-b">
                        <div>Date</div>
                        <div>Customer</div>
                        <div>Items</div>
                        <div>Total</div>
                        <div>Payment</div>
                      </div>
                      
                      <div className="divide-y">
                        {transactions.map((transaction) => (
                          <div key={transaction.id} className="grid grid-cols-5 p-3 items-center">
                            <div>{transaction.date}</div>
                            <div>{customers.find(c => c.id === transaction.customerId)?.name}</div>
                            <div>{transaction.items.length} items</div>
                            <div>${transaction.total.toFixed(2)}</div>
                            <div>
                              <Badge variant={transaction.paymentMode === "paid" ? "default" : "secondary"}>
                                {transaction.paymentMode === "paid" ? "Paid" : "Credit"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="paid" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Paid Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <div className="w-full border rounded-md">
                      <div className="grid grid-cols-5 bg-gray-100 p-3 font-medium border-b">
                        <div>Date</div>
                        <div>Customer</div>
                        <div>Items</div>
                        <div>Total</div>
                        <div>Tax</div>
                      </div>
                      
                      <div className="divide-y">
                        {filterTransactionsByPaymentMode("paid").map((transaction) => (
                          <div key={transaction.id} className="grid grid-cols-5 p-3 items-center">
                            <div>{transaction.date}</div>
                            <div>{customers.find(c => c.id === transaction.customerId)?.name}</div>
                            <div>{transaction.items.length} items</div>
                            <div>${transaction.total.toFixed(2)}</div>
                            <div>${transaction.tax.toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="credit" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Credit Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <div className="w-full border rounded-md">
                      <div className="grid grid-cols-5 bg-gray-100 p-3 font-medium border-b">
                        <div>Date</div>
                        <div>Customer</div>
                        <div>Items</div>
                        <div>Total</div>
                        <div>Tax</div>
                      </div>
                      
                      <div className="divide-y">
                        {filterTransactionsByPaymentMode("credit").map((transaction) => (
                          <div key={transaction.id} className="grid grid-cols-5 p-3 items-center">
                            <div>{transaction.date}</div>
                            <div>{customers.find(c => c.id === transaction.customerId)?.name}</div>
                            <div>{transaction.items.length} items</div>
                            <div>${transaction.total.toFixed(2)}</div>
                            <div>${transaction.tax.toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
