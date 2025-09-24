-- T-SQLinator Extension Test File
-- This file tests all formatting features

/* Settings and Variables */
DECLARE @fromdate CHAR(12) = '2018-01-01'
DECLARE @todate CHAR(12) = '2020-01-01'
DECLARE @department VARCHAR(50) = 'IT'

/* Test CTE with UNION ALL and complex WHERE conditions */
;WITH employee_hierarchy 
AS (
    SELECT DISTINCT emp.EmployeeID, emp.ManagerID, 0 AS Level, CAST(emp.EmployeeID AS NVARCHAR(MAX)) AS Path, emp.DepartmentID, emp.HireDate
    FROM Employees AS emp
    WHERE emp.HireDate >= @fromdate AND emp.HireDate < @todate AND emp.Status = 'Active'
    
    UNION ALL
    
    SELECT mgr.EmployeeID, mgr.ManagerID, eh.Level + 1 AS Level, CAST(eh.Path + '/' + mgr.EmployeeID AS NVARCHAR(MAX)) AS Path, mgr.DepartmentID, mgr.HireDate
    FROM Employees AS mgr
    INNER JOIN employee_hierarchy AS eh ON mgr.ManagerID = eh.EmployeeID AND mgr.EmployeeID <> eh.ManagerID AND mgr.DepartmentID = eh.DepartmentID
    WHERE mgr.HireDate >= @fromdate AND mgr.HireDate < @todate
)

/* Main query with CASE statement and window functions */
SELECT 
    e.EmployeeID,
    e.FirstName,
    e.LastName,
    e.Salary,
    CASE 
        WHEN e.Salary >= 100000 THEN 'Executive'
        WHEN e.Salary BETWEEN 75000 AND 99999 THEN 'Senior'
        WHEN e.Salary BETWEEN 50000 AND 74999 THEN 'Mid-Level'
        WHEN e.Salary < 50000 THEN 'Junior'
        ELSE 'Unknown'
    END AS SalaryCategory,
    ROW_NUMBER() OVER (
        PARTITION BY e.DepartmentID
        ORDER BY e.Salary DESC
    ) AS DepartmentRank,
    SUM(e.Salary) OVER (
        PARTITION BY e.DepartmentID
        ORDER BY e.HireDate
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS RunningTotalSalary,
    AVG(e.Salary) OVER (
        PARTITION BY e.DepartmentID
    ) AS AvgDepartmentSalary,
    eh.Level AS HierarchyLevel,
    eh.Path AS HierarchyPath
FROM Employees AS e
INNER JOIN employee_hierarchy AS eh ON e.EmployeeID = eh.EmployeeID
LEFT JOIN Departments AS d ON e.DepartmentID = d.DepartmentID
WHERE e.Status = 'Active'
    AND e.HireDate >= @fromdate
    AND e.HireDate < @todate
    AND d.DepartmentName IN ('IT', 'HR', 'Finance')
    AND NOT (e.Salary IS NULL OR e.Salary = 0)
GROUP BY 
    e.EmployeeID,
    e.FirstName,
    e.LastName,
    e.Salary,
    e.DepartmentID,
    e.HireDate,
    eh.Level,
    eh.Path
HAVING 
    COUNT(*) > 0
    AND AVG(e.Salary) > 45000
ORDER BY 
    e.DepartmentID,
    e.Salary DESC,
    e.LastName,
    e.FirstName
OPTION (MAXRECURSION 100)

/* Test complex INSERT with SELECT */
INSERT INTO EmployeeSummary (
    EmployeeID,
    FullName,
    SalaryCategory,
    DepartmentRank,
    ProcessedDate
)
SELECT 
    e.EmployeeID,
    CONCAT(e.FirstName, ' ', e.LastName) AS FullName,
    CASE 
        WHEN e.Salary >= 75000 THEN 'High'
        WHEN e.Salary >= 50000 THEN 'Medium'
        ELSE 'Low'
    END AS SalaryCategory,
    ROW_NUMBER() OVER (PARTITION BY e.DepartmentID ORDER BY e.Salary DESC) AS DepartmentRank,
    GETDATE() AS ProcessedDate
FROM Employees AS e
WHERE e.Status = 'Active'
    AND e.HireDate >= @fromdate

/* Test UPDATE with complex WHERE conditions */
UPDATE emp
SET 
    emp.LastReviewDate = GETDATE(),
    emp.ReviewStatus = CASE 
        WHEN emp.Salary > 80000 THEN 'Executive Review'
        WHEN emp.YearsOfService > 5 THEN 'Senior Review'
        ELSE 'Standard Review'
    END
FROM Employees AS emp
INNER JOIN Departments AS dept ON emp.DepartmentID = dept.DepartmentID
WHERE emp.LastReviewDate < DATEADD(YEAR, -1, GETDATE())
    AND dept.IsActive = 1
    AND emp.Status = 'Active'
    AND NOT EXISTS (
        SELECT 1 
        FROM EmployeeReviews AS er 
        WHERE er.EmployeeID = emp.EmployeeID 
            AND er.ReviewDate >= DATEADD(MONTH, -6, GETDATE())
    )

/* Test DELETE with subquery */
DELETE emp
FROM Employees AS emp
WHERE emp.Status = 'Terminated'
    AND emp.TerminationDate < DATEADD(YEAR, -2, GETDATE())
    AND NOT EXISTS (
        SELECT 1 
        FROM EmployeeArchive AS ea 
        WHERE ea.EmployeeID = emp.EmployeeID
    )

/* Multi-line comments test */
--This is a single line comment
--This is another single line comment
--Final comment in group

/* Test stored procedure creation */
CREATE PROCEDURE GetEmployeeSalaryReport
    @DepartmentID INT = NULL,
    @MinSalary MONEY = 0,
    @MaxSalary MONEY = 999999
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        e.EmployeeID,
        e.FirstName + ' ' + e.LastName AS FullName,
        e.Salary,
        d.DepartmentName,
        CASE 
            WHEN e.Salary > 75000 THEN 'High Earner'
            WHEN e.Salary > 50000 THEN 'Mid Earner'
            ELSE 'Entry Level'
        END AS EarningCategory
    FROM Employees AS e
    INNER JOIN Departments AS d ON e.DepartmentID = d.DepartmentID
    WHERE (@DepartmentID IS NULL OR e.DepartmentID = @DepartmentID)
        AND e.Salary BETWEEN @MinSalary AND @MaxSalary
        AND e.Status = 'Active'
    ORDER BY 
        d.DepartmentName,
        e.Salary DESC
END