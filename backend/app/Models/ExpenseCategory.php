<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExpenseCategory extends Model
{
    protected $guarded = [];

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }

    public function items()
    {
        return $this->hasMany(ExpenseItem::class);
    }
}

