<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class InventoryTransaction extends Model
{
    protected $guarded = [];
    
    public function product() {
        return $this->belongsTo(Product::class);
    }

    public function returnUser() {
        return $this->belongsTo(User::class, 'reference_id');
    }
}
